import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { Features } from 'src/app/interfaces/analysis.interface';
import { BoundingBox, FeaturePrediction, Label, Prediction } from 'src/app/interfaces/shared.interface';
import { v4 as uuid } from 'uuid';
import {
  getFirestore,
  collection,
  query,
  where,
  doc,
  getDocs,
  Firestore,
  updateDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ActivatedRoute } from '@angular/router';
import { Panel } from 'primeng/panel';
import { MESSAGE } from 'src/assets/messages';
import { ExtractionData } from 'src/app/interfaces/upload.interface';
import { ExtractionService } from 'src/app/services/extraction.service';
import { FireStorageService } from 'src/app/services/storage.service';
import { PredictionService } from 'src/app/services/prediction.service';
import { FeatureService } from 'src/app/services/feature.service';
import { PdfViewComponent } from '../../shared/components/pdf-viewer/pdf-viewer.component';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.scss'],
})
export class AnalysisComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(PdfViewComponent)
  private pdfView!: PdfViewComponent;

  private extraction: ExtractionData;
  private predictionsData: Prediction[];
  private featuresList: Features[];

  private firestore: Firestore;
  isLoading: boolean = true;
  activeButton: string = '';
  lastClickedFeatureButton: any = null;
  formSubmitted: boolean = false;
  categories: any[] = [];
  filteredCategories: any[] = [];
  iconClickedMap: Map<string, boolean> = new Map();
  isModalOpen: boolean = false;
  isAddingFeature: boolean = false;
  value: string = '';
  unit: string = '';
  documents: any[] = [];
  manualFeatures: Label[] = [];
  activeFeatureObj: any;
  deletingModalOpen: boolean = false;
  labelId: string;
  itemsToShowMap: { [featureName: string]: number } = {};
  acceptedCount: number = 0;
  unacceptedCount: number = 0;
  editingFeature: any = null;

  constructor(
    private fireStorageService: FireStorageService,
    private extractionService: ExtractionService,
    private predictionService: PredictionService,
    private featureService: FeatureService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {
    this.firestore = getFirestore();
  }

  async fetchDocs(): Promise<void> {
    const extractionId = this.route.snapshot.paramMap.get('extractionId');
    if(!extractionId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Something went wrong. Please re-open document.',
      });
      return;
    }
    const extraction = await this.extractionService.get(extractionId);
    const docs = extraction.documents.map(async (doc) => {
      return {
        id: doc.id,
        type: doc.type,
        url: await this.fireStorageService.getFileUrl(doc.bucket_path)
      }
    });

    this.documents = await Promise.all(docs);
    this.extraction = {...extraction};
  }

  async fetchPredictions(): Promise<void> {
    this.predictionsData = await this.predictionService.getPredictionsByExtractionId(this.extraction.id!);
  }

  async fetchFeatures(): Promise<void> {
    this.featuresList = await this.featureService.list();
  }

  groupPredictionsByFeatures(): void {
    const mappedFeaturePredictions = this.predictionsData.map(predictionData => {
      return  {
        ...predictionData,
        predictions: predictionData.predictions.map(prediction => {
          const predictionFeature = this.featuresList.find(feature => feature.id === prediction.feature_id);
          return {
            ...prediction,
            featureData: predictionFeature,
            featureName: predictionFeature?.name,
          };
        })
      }
    });

    // Group predictions by category
    const groups: {
      [key: string]: {
        [key: string]: {
          [key: string]: {
            [key: string]: any[],
            featureData?: any
          }
        }
      }
    } = {};

    mappedFeaturePredictions.forEach((predictionData) => {
      predictionData.predictions.forEach(prediction => {
        if(!prediction.featureData || !prediction.featureName) {
          throw 'Prediction feature not found!';
        }

        // Get category 1 and category 2 from feature data
        const [cat1, cat2] = prediction.featureData.categories;
        // Create category 1 if it doesn't exist
        if (!groups[cat1]) {
          groups[cat1] = {};
        }
        // Create category 2 if it doesn't exist
        if (!groups[cat1][cat2]) {
          groups[cat1] = {
            ...groups[cat1],
            [cat2]: {}
          };
        }

        if (!groups[cat1][cat2][prediction.featureName]) {
          groups[cat1][cat2] = {
            ...groups[cat1][cat2],
            [prediction.featureName]: {}
          };
        }

        if (!groups[cat1][cat2][prediction.featureName][predictionData.type]) {
          groups[cat1][cat2][prediction.featureName] = {
            ...groups[cat1][cat2][prediction.featureName],
            [predictionData.type]: [],
          };
          groups[cat1][cat2][prediction.featureName].featureData = prediction.featureData;
        }

        groups[cat1][cat2][prediction.featureName][predictionData.type].push(prediction);
      });
    })

    const categories = Object.keys(groups).map((category) => {
      return {
        name: category,
        subCategories: Object.keys(groups[category]).map((subCategory) => {
          const featureObjects = groups[category][subCategory];

          // Updated code to construct the features array
          const featuresArray = Object.keys(featureObjects).map((key) => {
            const featureList = featureObjects[key];

            return {
              list: featureList,
              featureData: featureObjects[key].featureData,
              id: uuid(),
              // feature_id:  null,
            };
          });

          return {
            name: subCategory,
            features: featuresArray,
          };
        }),
      };
    });
    this.categories = [...categories];
  }

  ngOnInit(): void {
    
    // this.initCategories();
    this.initServices();
    this.setActiveButton('all');
  }

  async initServices() {
    await this.fetchDocs();
    await this.fetchPredictions();
    await this.fetchFeatures();
    this.groupPredictionsByFeatures();
    this.filterCategoriesFun();
  }

  calculateUnacceptedCount(features: any[]) {
    const totalCount = features.reduce((featureTotal: any, featureObject: any) => {
      const featureKey = featureObject.list.automatic;
      const unclickedFeatures = featureKey.filter((feature: any) => {
        const featureId = this.isManualFeature(feature) ? `manual-${feature.id}` : `${feature.feature_id}-${feature.id}`;
        return !this.iconClickedMap.get(featureId);
      });
      return featureTotal + unclickedFeatures.length;
    }, 0);

    this.unacceptedCount = totalCount;
  }

  onInnerPanelToggle(innerPanel: Panel, features: any[]) {
    if (!innerPanel.collapsed) {
      this.calculateUnacceptedCount(features);
    } else {
      this.unacceptedCount = 0;
    }
  }

  isManualFeature(feature: any): boolean {
    return feature.feature_id === undefined;
  }

  openEditModal(feature: any): void {
    this.editingFeature = feature;
    this.value = feature.value;
    this.unit = feature.unit;
    this.isModalOpen = true;
  }

  setActiveButton(buttonName: string) {
    this.activeButton = buttonName;
    this.filterCategoriesFun();
  }

  filterCategoriesFun() {
    if (this.activeButton === 'all') {
      this.filteredCategories = JSON.parse(JSON.stringify(this.categories));
    } else {
      this.filteredCategories = this.categories.filter((category) => {
        return category.name === this.activeButton;
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categories'] && !changes['categories'].firstChange) {
      this.filterCategoriesFun();
    }
  }

  onValueUnitSelected(event: MouseEvent, featureName: string, featureObj: any, el: any, isManualFeature: boolean = false) {
    const newSelectedFeatureId = isManualFeature ? `manual-${featureObj.id}-${el.id}` : `${featureObj.id}-${el.id}`;
    if (this.iconClickedMap.get(newSelectedFeatureId)) {
      event.stopPropagation();
      this.iconClickedMap.set(newSelectedFeatureId, false);
      this.acceptedCount--;
      this.unacceptedCount++;

      this.sharedService.showMessage('success', 'Success', MESSAGE.success_unaccepted_feature);
    } else {
      event.stopPropagation();
      this.iconClickedMap.set(newSelectedFeatureId, true);
      this.acceptedCount++;
      this.unacceptedCount--;

      this.sharedService.showMessage('success', 'Success', MESSAGE.success_accepted_feature);
    }
  }

  isFeatureAccepted(featureObj: any, el: any, isManualFeature: boolean = false): boolean {
    const key = isManualFeature ? `manual-${featureObj.id}-${el.id}` : `${featureObj.id}-${el.id}`;
    return this.iconClickedMap.get(key) || false;
  }

  getFeatureStatus(featureObj: any, el: any): string {
    return this.isFeatureAccepted(featureObj, el) ? 'Unaccept feature' : 'Accept feature';
  }

  async removeFeature(featureId: string) {
    try {
      // TODO: Update this method in service.
      // Get the document in the "predictions" collection based on the featureId
      const predictionsQuery = query(collection(this.firestore, 'predictions'), where('predictions', 'array-contains', { id: featureId }));
      const predictionsSnapshot = await getDocs(predictionsQuery);

      if (!predictionsSnapshot.empty) {
        // Get the first document matching the featureId
        const predictionDoc = predictionsSnapshot.docs[0];

        const predictionData = predictionDoc.data() as Prediction;
        const updatedPredictions = predictionData.predictions.filter((prediction) => prediction.id !== featureId);

        // Update the 'predictions' field in the document
        await updateDoc(doc(this.firestore, 'predictions', predictionDoc.id), {
          predictions: updatedPredictions,
        });
      } else {
        console.error('No document found with the provided featureId:', featureId);
      }
    } catch (error) {
      console.error('Error removing feature:', error);
    }
  }

  filterOutFeature(featureId: string) {
    // Iterate through the categories and subcategories
    this.categories = this.categories.map((category) => {
      return {
        ...category,
        subCategories: category.subCategories.map((subCategory: any) => {
          return {
            ...subCategory,
            features: subCategory.features.map((featureObject: any) => {
              const featureKey = Object.keys(featureObject)[0];
              const filteredPredictions = featureObject[featureKey].filter((prediction: any) => prediction.id !== featureId);

              return {
                [featureKey]: filteredPredictions,
              };
            }),
          };
        }),
      };
    });
  }

  filterSubCategories(categoryName: string): boolean {
    return this.activeButton === categoryName;
  }

  getLabelsByFeatureId(featureId: string): Label[] {
    return this.manualFeatures.filter((feature) => feature.feature_id === featureId);
  }

  getBackgroundColor(confidence: number): string {
    if (confidence === 0) {
      return 'red';
    } else if (confidence < 50) {
      return 'grey';
    } else {
      return '#0c9200';
    }
  }

  getFeatureName(featureObj: any): string {
    const featureKey = Object.keys(featureObj)[0];
    return featureObj[featureKey][0]?.featureData.title || featureKey;
  }

  getFeatureElements(featureObj: any): any[] {
    return featureObj[Object.keys(featureObj)[0]];
  }

  getFeatureLabels(featureObj: any): any[] {
    return this.manualFeatures.filter((label) => label.feature_id === featureObj.feature_id);
  }

  showMoreItems(featureObj: any, type = 'automatic'): void {
    const maxVisibleItems = 5;
    const featureName = featureObj.featureData.title;

    this.itemsToShowMap[featureName] = Math.min(
      (this.itemsToShowMap[featureName] === undefined ? 0 : this.itemsToShowMap[featureName]) + maxVisibleItems,
      featureObj.list[type].length
    );
  }

  getVisibleFeatureElements(featureObj: any, type = 'automatic'): any[] {
    const featureName = featureObj.featureData.title;
    const itemsToShow = this.itemsToShowMap[featureName] || 5;
    return (featureObj.list[type] as any[])
      .sort((a, b) => b['confidence'] - a['confidence'])
      .slice(0, itemsToShow);
  }

  isLandscape(canvas: HTMLCanvasElement): boolean {
    return canvas.width > canvas.height;
  }

  ngOnDestroy(): void {
  }

  async deleteLabel(): Promise<void> {
    const labelId = this.labelId;
    try {
      await deleteDoc(doc(this.firestore, 'labels', labelId));
      this.closeDeleteModal();

      this.sharedService.showMessage('success', 'Success', MESSAGE.success_delete_label);

      // Fetch the updated manual features after the label is deleted
      // this.fetchManualFeatures();
    } catch (error) {
      this.sharedService.showMessage('error', 'Error', MESSAGE.error_delete_label);
      console.error('Error deleting label:', error);
    }
  }

  convertAbsoluteToRelative(bbox: BoundingBox, pageWidth: number, pageHeight: number): BoundingBox {
    return {
      top: bbox.top / pageHeight,
      left: bbox.left / pageWidth,
      width: bbox.width / pageWidth,
      height: bbox.height / pageHeight,
    };
  }

  onPredictionClick(prediction: FeaturePrediction): void {
    this.pdfView.goToPage(prediction.bounding_box.page);
  }

  isLastClickedButton(el: any): boolean {
    return this.lastClickedFeatureButton === el;
  }

  onSearchButtonClick(el: any, featureObj: any): void {
    this.pdfView.clearAllBoundingBoxes();
    const elId = el.feature_id;
    this.lastClickedFeatureButton = el;
    // Check if the el object has manualFeature property
    if (el.hasOwnProperty('manualFeature')) {
      console.warn('Bounding box not found for the manual feature.');
      return;
    }

    const currentState = this.iconClickedMap.get(elId);
    this.iconClickedMap.set(elId, !currentState);
    // Find the document index that matches the document_id
    const documentIndex = this.documents.findIndex((document: any) => {
      return document.id === el.bounding_box.document_id;
    });

    this.pdfView.predictionClickObj = {
      isPageRendered: false,
      isPredictionClick: true,
      prediction: el,
    };

    if (documentIndex === -1) {
      alert('Document not found');
      return;
    }
    // Switch to the correct document if not already on it
    if (documentIndex !== this.pdfView.currentDocumentIndex) {
      // this.switchDocument(documentIndex);
    } else {
      this.pdfView.removePreviousBoundingBox();
      this.onPredictionClick(el);
    }
  }

  //Adding a feature
  onAddFeatureClick(featureObj: any) {
    window.scrollTo(0, 0);
    this.isAddingFeature = !this.isAddingFeature;

    if (this.isAddingFeature) {
      this.activeFeatureObj = {...featureObj};
    }
  }

  async onSubmitValueUnit() {
    this.formSubmitted = true;
    if (this.value == '') {
      return;
    }

    if (this.editingFeature) {
      const featureId = this.editingFeature.id;
      this.editingFeature.value = this.value;
      this.editingFeature.unit = this.unit;

      // Update the feature in Firebase

      const featureRef = doc(this.firestore, 'labels', featureId);
      await updateDoc(featureRef, {
        value: this.value,
        unit: this.unit,
      });
      this.sharedService.showMessage('success', 'Success', 'The feature has been successfully updated.');

      this.closeModal();
    } else {
      const documentId = this.documents[this.pdfView.currentDocumentIndex].id;
      const lastRectangle = this.pdfView.rectangles[this.pdfView.rectangles.length - 1];

      // Convert absolute to relative coordinates
      const relativeBoundingBox = this.convertAbsoluteToRelative(
        {
          top: lastRectangle.get('top')!,
          left: lastRectangle.get('left')!,
          width: lastRectangle.get('width')!,
          height: lastRectangle.get('height')!,
        },
        this.pdfView.fabricCanvas.getWidth(),
        this.pdfView.fabricCanvas.getHeight()
      );

      // Create a new Label object
      const newLabel: Label = {
        id: uuid(),
        feature_id: this.activeFeatureObj.id,
        bounding_box: {
          page: this.pdfView.currentPage,
          document_id: documentId,
          bounding_box: relativeBoundingBox,
        },
        value: this.value,
        unit: this.unit,
      };

      try {
        // Save the newLabel object to the "labels" collection
        await setDoc(doc(this.firestore, 'labels', newLabel.id), newLabel);

        this.sharedService.showMessage('success', 'Success', MESSAGE.success_added_feature);
        // await this.fetchManualFeatures();
        this.pdfView.clearAllBoundingBoxes();
        this.closeModal();
      } catch (error) {
        this.sharedService.showMessage('success', 'Success', MESSAGE.error_adding_feature);
        console.error('Error saving new label:', error);
      }
    }
  }

  openValueUnitModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isAddingFeature = false;
    this.pdfView.clearAllBoundingBoxes();
  }

  openDeleteModal(id: string) {
    this.labelId = id;
    this.deletingModalOpen = true;
  }

  closeDeleteModal() {
    this.deletingModalOpen = false;
  }

  shouldApplyGreenBorder(featureObj: any, elementId: string, isManualFeature: boolean = false): boolean {
    const currentFeatureId = isManualFeature ? `manual-${featureObj.id}-${elementId}` : `${featureObj.id}-${elementId}`;
    return this.iconClickedMap.get(currentFeatureId) || false;
  }
}

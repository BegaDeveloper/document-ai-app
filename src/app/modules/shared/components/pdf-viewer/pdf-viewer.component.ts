import { AfterViewInit, Component, ElementRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fabric } from 'fabric';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { Subject } from 'rxjs';
import { BoundingBox, FeaturePrediction } from 'src/app/interfaces/shared.interface';

// Timer reference (it will allow us to cancel multiple rendering and increase performance).
let textRenderedTimer: NodeJS.Timeout;
// Timer reference (it will allow us to cancel multiple rendering and increase performance).
let pageRenderedTimer: NodeJS.Timeout;
// Timer reference (it will allow us to cancel multiple rendering and increase performance).
let pdfSearchTimer: NodeJS.Timeout;

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewComponent implements OnInit, AfterViewInit {
  @Input()
  set documents(docs: any[]) {
    if(!docs.length) return;
    this.pdfDocuments = docs;
    this.pdfSrc = this.documents[this.currentDocumentIndex].url;
    this.currentDocumentType = this.documents[this.currentDocumentIndex]?.type;
  }
  get documents() {
    return this.pdfDocuments;
  }

  @Input()
  set isDrawing(mode: boolean) {
    this.drawingMode = mode;
    this.isAddingFeature = mode;
  }
  get isDrawing() {
    return this.drawingMode;
  }

  pdfSrc = '';
  searchTerm = '';
  currentDocumentType = '';
  totalMatch = 0;
  currentMatch = 0;
  totalPages = 0;
  pdfZoom = 1;
  currentPage = 1;
  currentDocumentIndex = 0;
  showPageInput = false;
  isAddingFeature = false;
  isLandscapeMode = false;
  drawingRect: fabric.Rect | undefined;
  rectangles: fabric.Rect[] = [];
  currentRectangle: fabric.Rect | undefined;
  fabricCanvas: fabric.Canvas;

  private drawingMode = false;
  private pdfDocuments: any[] = [];
  predictionClickObj: {
    isPageRendered: boolean;
    isPredictionClick: boolean;
    prediction: FeaturePrediction | undefined;
  } = {
    isPageRendered: false,
    isPredictionClick: false,
    prediction: undefined,
  };
  @ViewChild('pdfContainer', { static: true }) pdfContainer: ElementRef;
  @ViewChild('pdfCanvas', { static: true }) pdfCanvas: ElementRef;
  @ViewChild(PdfViewerComponent) private pdfComponent: PdfViewerComponent;


  ngOnInit(): void {
    fabric.Object.prototype.transparentCorners = false;
  }

  ngAfterViewInit(): void {
    this.initFabricCanvas();
  }

  isLandscape(canvas: HTMLCanvasElement): boolean {
    return canvas.width > canvas.height;
  }

  /**
  Search for a specific string in the PDF document.
  @param {string} stringToSearch - The string to search for in the PDF document.
  @returns {void}
  **/
  search(stringToSearch: string): void {
    this.pdfComponent.eventBus.dispatch('find', {
      query: stringToSearch,
      type: 'again',
      caseSensitive: false,
      findPrevious: false,
      highlightAll: true,
      phraseSearch: true,
    });
    this.clearAllBoundingBoxes();
  }

  searchNext() {
    this.pdfComponent.eventBus.dispatch('find', {
      query: this.searchTerm,
      caseSensitive: false,
      findPrevious: false,
      highlightAll: true,
      phraseSearch: true,
      type: 'again',
    });
  }

  searchPrevious() {
    this.pdfComponent.eventBus.dispatch('find', {
      query: this.searchTerm,
      caseSensitive: false,
      findPrevious: true,
      highlightAll: true,
      phraseSearch: true,
      type: 'again',
    });
  }

  switchDocument(index: number): void {
    if (index < 0 || index >= this.documents.length || !this.documents[index]?.url) {
      return;
    }
    this.currentDocumentIndex = index;
    this.pdfSrc = this.documents[this.currentDocumentIndex].url;
    this.currentPage = 1;
    this.clearAllBoundingBoxes();
    this.currentDocumentType = this.documents[this.currentDocumentIndex]?.type;
  }

  goToNextPage(): void {
    this.predictionClickObj.isPredictionClick = false;
    this.clearAllBoundingBoxes();
    if (this.currentPage < this.pdfComponent.pdfViewer.pagesCount) {
      this.currentPage++;
      this.pdfComponent.pdfViewer.currentPageNumber = this.currentPage;
    }
  }

  goToPreviousPage(): void {
    this.predictionClickObj.isPredictionClick = false;
    this.clearAllBoundingBoxes();
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pdfComponent.pdfViewer.currentPageNumber = this.currentPage;
    }
  }

  togglePageInput(): void {
    this.showPageInput = !this.showPageInput;
  }

  onSubmitPageInputForm(pageNumber: number): void {
    this.goToPage(pageNumber);
    this.togglePageInput();
  }

  goToPage(pageNumber: number): void {
    this.pdfComponent.pdfViewer.currentPageNumber = pageNumber;
    if (this.currentPage === pageNumber) {
      this.drawBoundingBoxToCanvas();
    } else {
      this.currentPage = pageNumber;
    }
  }

  onPdfLoadComplete(event: {numPages: number}): void {
    this.totalPages = event.numPages;
    this.currentRectangle = undefined;

    this.pdfComponent.eventBus.on('pagerendered', this.resizeHandler.bind(this));
    this.pdfComponent.eventBus.on('updateviewarea', this.onPdfFind.bind(this));
    
  }

  onPageRendered() {
    this.predictionClickObj.isPageRendered = true;
    clearTimeout(pageRenderedTimer);
    pageRenderedTimer = setTimeout(() => {
      if (this.predictionClickObj.isPredictionClick && this.predictionClickObj.prediction) {
        // this.onPredictionClick(this.predictionClickObj.prediction);
      }
    }, 500);
  }

  onPageChange() {
    // Page and text is not rendering in some cases but page change does.
    setTimeout(() => {
      if (!this.predictionClickObj.isPageRendered) {
        this.drawBoundingBoxToCanvas();
      }
    }, 500);
  }

  onTextRendered(): void {
    clearTimeout(textRenderedTimer);
    textRenderedTimer = setTimeout(() => {
      this.drawBoundingBoxToCanvas();
    }, 800);
  }

  onPdfFind(): void {
    clearTimeout(pdfSearchTimer);
    pdfSearchTimer = setTimeout(() => {
      const selected = this.pdfComponent.pdfFindController.selected;
      let currentPage = this.pdfComponent.pdfFindController.pageMatchesLength
        ?.slice(0, selected?.pageIdx)
        .reduce((prev, current) => (prev += current.length), 0);
      currentPage += selected?.matchIdx! + 1;
      this.currentMatch = currentPage;
      if (
        this.totalMatch !== this.pdfComponent.pdfFindController._matchesCountTotal &&
        this.pdfComponent.pdfFindController._matchesCountTotal !== undefined
      ) {
        this.totalMatch = this.pdfComponent.pdfFindController._matchesCountTotal;
      }
    }, 500);
  }

  initFabricCanvas() {
    this.fabricCanvas = new fabric.Canvas(this.pdfCanvas.nativeElement, {
      selection: false,
    });

    this.initCanvasListeners();

    // window.addEventListener('resize', this.resizeHandler.bind(this));
  }

  resizeHandler() {
    const pdfViewerCanvas = this.pdfContainer.nativeElement.querySelector('canvas');
    const pdfPages = this.pdfContainer.nativeElement.querySelectorAll('.page');
    if (pdfViewerCanvas && pdfPages && pdfPages.length > 0) {
      const landscape = this.isLandscape(pdfViewerCanvas);
      this.pdfZoom = landscape ? 1.01 : 1;
      this.isLandscapeMode = landscape ? true : false;

      this.fabricCanvas.setWidth(pdfPages[0].offsetWidth * this.pdfZoom || 0);
      this.fabricCanvas.setHeight(pdfPages[0].offsetHeight * this.pdfZoom || 0);
      // this.fabricCanvas.calcOffset();
      const canvasContainer: HTMLElement = this.pdfContainer.nativeElement.querySelectorAll('.canvas-container')[0];
      const pageRects = (pdfPages[0] as HTMLElement).getBoundingClientRect();
      const canvasRects = canvasContainer.getBoundingClientRect();

      if (pageRects.x !== canvasRects.x || pageRects.y !== canvasRects.y) {
        if(pageRects.x > canvasRects.x) {
          const offset = pageRects.x - canvasRects.x;
          canvasContainer.style.left = (canvasRects.x + offset - 10) + 'px';
        }

        if(pageRects.x < canvasRects.x) {
          const offset = canvasRects.x - pageRects.x;
          canvasContainer.style.left = (canvasRects.x - offset - 10) + 'px';
        }

        if(pageRects.y !== canvasRects.y) {
          canvasContainer.style.top = pageRects.y + 'px';
        }
      }
    }
  }

  //PDF ANNOTATION
  initCanvasListeners() {
    this.fabricCanvas.on('mouse:down', (event) => {
      if (this.isAddingFeature) {
        const pointer = this.fabricCanvas.getPointer(event.e);
        const startPoint = {
          x: pointer.x,
          y: pointer.y,
        };

        this.drawingRect = new fabric.Rect({
          left: startPoint.x,
          top: startPoint.y,
          width: 0,
          height: 0,
          fill: 'rgba(7, 129, 23, 0.5)',
          selectable: true,
          stroke: 'red',
          strokeWidth: 1,
          hoverCursor: 'default',
        });

        this.fabricCanvas.add(this.drawingRect);
        this.isDrawing = true;
      }
    });

    this.fabricCanvas.on('mouse:move', (event) => {
      if (
        !this.isDrawing ||
        !this.isAddingFeature ||
        !this.drawingRect ||
        !this.drawingRect.left ||
        !this.drawingRect.top
      ) {
        return;
      }

      const pointer = this.fabricCanvas.getPointer(event.e);
      const endPoint = {
        x: pointer.x,
        y: pointer.y,
      };

      const width = endPoint.x - this.drawingRect.left;
      const height = endPoint.y - this.drawingRect.top;

      this.drawingRect.set('width', width);
      this.drawingRect.set('height', height);
      this.fabricCanvas.renderAll();
    });

    this.fabricCanvas.on('mouse:up', (event) => {
      if (this.isDrawing && this.isAddingFeature) {
        this.rectangles.push(this.drawingRect as fabric.Rect);

        this.isDrawing = false;
        this.drawingRect = undefined;
      }
    });

    this.fabricCanvas.on('mouse:dblclick', (event) => {
      const target = event.target;
      if (target && target instanceof fabric.Rect) {
        this.fabricCanvas.remove(target);
        const index = this.rectangles.indexOf(target);
        if (index > -1) {
          this.rectangles.splice(index, 1);
        }
      }
    });
  }

  convertRelativeToAbsolute(bbox: BoundingBox, pageWidth: number, pageHeight: number): BoundingBox {
    return {
      top: bbox.top * pageHeight,
      left: bbox.left * pageWidth,
      width: bbox.width * pageWidth,
      height: bbox.height * pageHeight,
    };
  }

  convertAbsoluteToRelative(bbox: BoundingBox, pageWidth: number, pageHeight: number): BoundingBox {
    return {
      top: bbox.top / pageHeight,
      left: bbox.left / pageWidth,
      width: bbox.width / pageWidth,
      height: bbox.height / pageHeight,
    };
  }

  drawBoundingBoxToCanvas(): void {
    // this.resizeHandler();

    if (this.predictionClickObj.isPredictionClick && this.predictionClickObj.prediction) {
      const canvasWidth = this.fabricCanvas.getWidth();
      const canvasHeight = this.fabricCanvas.getHeight();
      const absoluteBbox = this.convertRelativeToAbsolute(
        this.predictionClickObj.prediction.bounding_box.bounding_box,
        canvasWidth,
        canvasHeight
      );
      this.clearAllBoundingBoxes(); // Add this line to remove all rectangles
      this.drawBoundingBox(absoluteBbox);
    }
    this.predictionClickObj.isPredictionClick = false;
  }

  drawBoundingBox(bbox: BoundingBox): void {
    const rectangle = new fabric.Rect({
      left: bbox.left,
      top: bbox.top,
      width: bbox.width,
      height: bbox.height,
      fill: 'rgba(7, 129, 23, 0.5)',
      selectable: false,
      stroke: 'red',
      strokeWidth: 1,
      hoverCursor: 'default',
    });

    this.fabricCanvas.add(rectangle);
    this.fabricCanvas.renderAll();

    this.currentRectangle = rectangle;
  }

  removePreviousBoundingBox(): void {
    if (this.rectangles.length > 0) {
      const lastRectangle = this.rectangles.pop();
      this.fabricCanvas.remove(lastRectangle!);
      this.fabricCanvas.renderAll();
    }
  }

  clearAllBoundingBoxes(): void {
    if (this.currentRectangle) {
      this.fabricCanvas.remove(this.currentRectangle);
      this.currentRectangle = undefined;
    }
  }
}

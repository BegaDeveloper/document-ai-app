import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CompanyService } from 'src/app/services/company.service';
import { ExtractionService } from 'src/app/services/extraction.service';
import { ExtractionData, Year } from 'src/app/interfaces/upload.interface';
import { DocumentType, ExtractionStatusType } from 'src/assets/enums';
import { Company } from 'src/app/interfaces/shared.interface';
import { SharedService } from 'src/app/services/shared.service';
import { MESSAGE } from 'src/assets/messages';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit {
  uploadForm: FormGroup;
  uploadedFiles: any[] = [];
  documentType: any = [{ name: DocumentType.ANNUAL_REPORT }, { name: DocumentType.SUSTAINABILITY_REPORT }, { name: DocumentType.OTHER }];
  companies: Company[];
  company: Company;
  extraction: ExtractionData;
  years: Year[] = [];
  year: Number;
  notPdf: boolean = false;
  extractionId: string | null;
  selectedCompanyId: string | null;
  selectedYear: number | null;
  disableCompanyAndYearInputs: boolean = false;
  modalOpen: boolean = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private extractionService: ExtractionService,
    private router: Router,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.years = this.generate_years();

    this.uploadForm = this.fb.group({
      company: [null, Validators.required],
      year: [this.years[0], Validators.required],
      documents: this.fb.array([]),
    });

    this.load_query_params();
    this.load_extraction();
    this.load_companies();
  }

  generate_years(): Year[] {
    let years: Year[] = [];
    const startYear = 1950;
    const endYear = 2023;
    for (let year = endYear; year >= startYear; year--) {
      years.push({ year: year, name: JSON.stringify(year) });
    }
    return years;
  }

  load_companies() {
    this.companyService.list().subscribe((res) => {
      this.companies = res;
      // Set default company
      this.uploadForm.patchValue({ company: {}, year: this.years[0] });

      // Set company and year if they are in the query params
      this.set_company_and_year();
    });
  }

  load_extraction() {
    this.extractionService.get(this.extractionId!).then((res) => {
      this.extraction = res;
      console.log(this.extraction);
    });
  }

  load_query_params() {
    this.route.queryParams.subscribe((params) => {
      this.extractionId = params['extractionId'];
      this.selectedCompanyId = params['companyId'];
      this.selectedYear = params['year'];
    });
  }

  set_company_and_year() {
    this.route.queryParams.subscribe(async (params) => {
      if (this.selectedCompanyId && this.selectedYear) {
        await this.companyService.get(this.selectedCompanyId).then((res) => {
          this.company = res;
        });

        this.uploadForm.patchValue({
          company: this.company,
          year: {
            year: Number(this.selectedYear),
            name: this.selectedYear.toString(),
          },
        });
        this.disableCompanyAndYearInputs = true;
      }
    });
  }

  /**
   * Returns the 'documents' FormArray from the parent FormGroup.
   * @returns {FormArray} The 'documents' FormArray.
   */
  getDocs(): FormArray {
    return this.uploadForm.get('documents') as FormArray;
  }

  /**
   * Returns the name of the document at the specified index.
   * @param {number} index - The index of the document to get the name of.
   * @returns {string} The name of the document at the specified index.
   */
  getDocName(index: number): string {
    return this.getDocs().controls[index].get('name')!.value;
  }

  /**
   * Adds uploaded files to the documents array in the form.
   * @param {any} event - The event object representing the file upload.
   * @returns {void} Nothing.
   */
  onUpload(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        this.notPdf = true;
        this.sharedService.showMessage('error', 'Error', MESSAGE.error_pdf_only);
        continue;
      }
      this.notPdf = false;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      const documentFormGroup = this.fb.group({
        name: file.name,
        type: [DocumentType.OTHER, Validators.required],
        bucket_path: [file, Validators.required],
      });
      this.getDocs().push(documentFormGroup);
      this.uploadedFiles.push(file);
    }
    if (!this.notPdf) {
      this.sharedService.showMessage('success', 'Success', MESSAGE.success_upload);
    }
  }

  /**
   * Prevents the default dragover event and stops the event from propagating.
   * @param {any} event - The dragover event.
   * @returns {void} Nothing.
   */
  onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Prevents the default drop event, stops the event from propagating, and adds each file from the dropped files
   * to the documents array as a new form group with a name and type field using Angular FormBuilder.
   * @param {any} event - The drop event.
   * @returns {void} Nothing.
   */
  onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        this.sharedService.showMessage('error', 'Error', MESSAGE.error_pdf_only);

        continue;
      }

      let reader = new FileReader();
      reader.readAsDataURL(file);
      const documentFormGroup = this.fb.group({
        name: file.name,
        type: [DocumentType.OTHER, Validators.required],
        bucket_path: [file, Validators.required],
      });
      this.getDocs().push(documentFormGroup);
      this.uploadedFiles.push(file);
    }
  }

  /**
   * Removes a document form group at a given index from the documents array in the form.
   * @param {number} index - The index of the document form group to be removed.
   * @returns {void} Nothing.
   */
  removeFile(index: number) {
    const documentsArray = this.uploadForm.get('documents') as FormArray;
    documentsArray.removeAt(index);
    this.sharedService.showMessage('success', 'Success', MESSAGE.success_file_remove);
  }

  /**
   * Submits the form data and sends a POST request to upload a new report to the server.
   * Displays a success message and resets the form and uploaded files if the request is successful.
   * Displays an error message if the request fails.
   * @returns {void} Nothing.
   */
  async onSubmit(): Promise<void> {
    const uploadForm = this.uploadForm.value;

    // create the extraction object
    const extraction: ExtractionData = {
      company_id: uploadForm.company.id,
      year: uploadForm.year.year,
      documents: uploadForm.documents.map((doc: any) => {
        const { name, type, bucket_path } = doc;
        return { name, type: type.name, bucket_path: bucket_path.name, file: bucket_path };
      }),
      status: ExtractionStatusType.PENDING,
    };

    // check if the type of any document is not selected using any
    if (extraction.documents.some((document: any) => document.type === undefined)) {
      this.sharedService.showMessage('error', 'Error', MESSAGE.error_doctype);
      return;
    } else {
      this.isLoading = true;

      // If selectedCompanyId and selectedYear are provided, update the extraction
      if (this.selectedCompanyId && this.selectedYear && this.extractionId) {
        let documents = this.uploadForm.value.documents.map((document: any) => {
          const { name, type, bucket_path } = document;
          return { name, type: type.name, bucket_path: bucket_path.name };
        });

        for (let i = 0; i < documents.length; i++) {
          this.extraction.documents.push(documents[i]);
        }
        this.extraction.status = ExtractionStatusType.PENDING;
        this.extractionService
          .update(this.extractionId, this.extraction)
          .then(() => {
            this.closeModal();

            this.sharedService.showMessage('success', 'Success', MESSAGE.success_added_doc);
            this.isLoading = false;
            this.uploadForm.reset();
            this.uploadedFiles = [];
            this.router.navigate(['/main/overview']);
          })
          .catch((error) => {
            this.isLoading = false;
            this.closeModal();
            this.sharedService.showMessage('error', 'Error', error.message);
          });
      } else {
        this.extractionService
          .create(extraction)
          .then(async (id) => {
            this.sharedService.showMessage('success', 'Success', MESSAGE.success_added_extraction);
            this.isLoading = false;
            this.uploadForm.reset();
            this.uploadedFiles = [];
            this.router.navigate(['/main/overview']);
          })
          .catch((error) => {
            this.isLoading = false;
            this.sharedService.showMessage('error', 'Error', error.message);
          });
      }
    }
  }

  closeModal() {
    this.modalOpen = false;
  }

  openModal() {
    this.modalOpen = true;
  }
}

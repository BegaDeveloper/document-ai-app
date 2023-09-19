import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { Observable } from 'rxjs';
import { Firestore, collection, query, getDocs, where, updateDoc } from '@angular/fire/firestore';

import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { ExtractionData, Document, ExtractionWithId } from 'src/app/interfaces/upload.interface';
import { CompanyDTO } from 'src/app/interfaces/company.interface';
import { DocumentType, ExtractionStatusType } from 'src/assets/enums';
import { MESSAGE } from 'src/assets/messages';
import { ExtractionService } from 'src/app/services/extraction.service';
import { Company } from 'src/app/interfaces/shared.interface';
import { CompanyService } from 'src/app/services/company.service';

interface ExtractionWithCompanyName extends ExtractionWithId {
  company_name: string;
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  animations: [
    trigger('rowExpansionTrigger', [
      state(
        'void',
        style({
          transform: 'translateX(-10%)',
          opacity: 0,
        })
      ),
      state(
        'active',
        style({
          transform: 'translateX(0)',
          opacity: 1,
        })
      ),
      transition('* <=> *', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
    ]),
  ],
})
export class OverviewComponent implements OnInit {
  @ViewChild('dt1') dt1: Table;
  multiple: boolean = true;
  rowexpansion: boolean = true;
  comapanyData: ExtractionData[];
  searchText: string;
  extractions$: Observable<any[]>;
  extractions: ExtractionWithCompanyName[];
  companies: Company[];
  companies$: Observable<CompanyDTO[]>;
  isModalOpen: boolean = false;
  documentTypes: any = [{ name: DocumentType.ANNUAL_REPORT }, { name: DocumentType.SUSTAINABILITY_REPORT }, { name: DocumentType.OTHER }];
  ExtractionStatusType = ExtractionStatusType;

  constructor(
    private primengConfig: PrimeNGConfig,
    private firestore: Firestore,
    private router: Router,
    private messageService: MessageService,
    private extractionService: ExtractionService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.primengConfig.ripple = true;

    this.extractionService.list().subscribe((res) => {
      this.extractions = res as ExtractionWithCompanyName[];
      // retrieve the company name from the company id
      this.extractions.forEach((extraction) => {
        this.companyService.get(extraction.company_id).then((res) => {
          extraction.company_name = res.name;
        });
      });
    });
  }

  /**
   * Applies a global filter to the DataTable.
   * @param {any} $event - The event that triggered the filter.
   * @param {string} stringVal - The string value to use for filtering.
   * @returns {void}
   */
  applyFilterGlobal($event: any, stringVal: string) {
    this.dt1.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
  }

  /**
   * Removes a document from the 'documents' array of the specified ExtractionData document in 'extractions' collection
   * @param {Document} document - The document to remove.
   * @returns {Promise<void>}
   */
  async removeDocument(extraction: ExtractionWithId, document: Document): Promise<void> {
    try {
      this.closeModal();

      await this.extractionService.deleteDocument(extraction.id, document.id);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: MESSAGE.success_removed_document,
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: MESSAGE.error_removing_document,
      });
    }
  }

  async updateDocumentType(extraction: ExtractionWithId, documentId: String, documentType: DocumentType): Promise<void> {
    extraction.documents.forEach((document) => {
      if (document.id === documentId) {
        document.type = documentType;
      }
    });
    try {
      this.extractionService.update(extraction.id, extraction).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: MESSAGE.success_changed_document_type,
        });
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: MESSAGE.error_changing_document_type,
      });
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  openModal() {
    this.isModalOpen = true;
  }

  /**
   * Navigates to the Upload page with the specified extraction data.
   * @param {ExtractionWithCompanyName} extraction - The extraction data to pass to the Upload page.
   */
  onAddDocument(extraction: ExtractionWithCompanyName): void {
    this.router.navigate(['/main/upload'], {
      queryParams: {
        companyId: extraction.company_id,
        year: extraction.year,
        extractionId: extraction.id,
      },
    });
  }

  openExtraction(extraction: ExtractionWithCompanyName) {
    this.router.navigate([
      '/main/analysis',
      {
        extractionId: extraction.id
      },
    ]);
  }

  async updateStatus(extraction: ExtractionWithCompanyName, status: ExtractionStatusType): Promise<void> {
    extraction.status = status;
    console.log(extraction);
    console.log(status);

    try {
      this.extractionService.update(extraction.id, extraction, false).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: MESSAGE.success_changed_status,
        });
      });
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: MESSAGE.error_changing_status,
      });
    }
  }
}

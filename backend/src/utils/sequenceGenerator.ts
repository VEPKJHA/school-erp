import { prisma } from '../config/prisma';

export type SequenceEntityType =
  | 'ADMISSION'
  | 'STUDENT'
  | 'APPLICATION'
  | 'INVOICE'
  | 'RECEIPT';

export class SequenceGenerator {
  /**
   * Safely and atomically increments the sequence counter for a specific entity type,
   * school tenant, and academic year, avoiding race conditions.
   */
  static async getNextSequence(
    schoolId: string,
    entityType: SequenceEntityType,
    year = new Date().getFullYear(),
    client: any = prisma
  ): Promise<number> {
    const record = await client.sequenceCounter.upsert({
      where: {
        schoolId_entityType_year: {
          schoolId,
          entityType,
          year,
        },
      },
      update: {
        lastValue: {
          increment: 1,
        },
      },
      create: {
        schoolId,
        entityType,
        year,
        lastValue: 1,
      },
    });

    return record.lastValue;
  }

  static async generateAdmissionNumber(
    schoolId: string,
    year = new Date().getFullYear(),
    client: any = prisma
  ): Promise<string> {
    const seq = await this.getNextSequence(schoolId, 'ADMISSION', year, client);
    return `ADM/${year}/${seq.toString().padStart(6, '0')}`;
  }

  static async generateStudentCode(
    schoolId: string,
    year = new Date().getFullYear(),
    client: any = prisma
  ): Promise<string> {
    const seq = await this.getNextSequence(schoolId, 'STUDENT', year, client);
    return `STU-${year}-${seq.toString().padStart(6, '0')}`;
  }

  static async generateApplicationNumber(
    schoolId: string,
    year = new Date().getFullYear(),
    client: any = prisma
  ): Promise<string> {
    const seq = await this.getNextSequence(schoolId, 'APPLICATION', year, client);
    return `APP/${year}/${seq.toString().padStart(6, '0')}`;
  }

  static async generateInvoiceNumber(
    schoolId: string,
    year = new Date().getFullYear(),
    client: any = prisma
  ): Promise<string> {
    const seq = await this.getNextSequence(schoolId, 'INVOICE', year, client);
    return `INV/${year}/${seq.toString().padStart(6, '0')}`;
  }

  static async generateReceiptNumber(
    schoolId: string,
    year = new Date().getFullYear(),
    client: any = prisma
  ): Promise<string> {
    const seq = await this.getNextSequence(schoolId, 'RECEIPT', year, client);
    return `REC/${year}/${seq.toString().padStart(6, '0')}`;
  }
}

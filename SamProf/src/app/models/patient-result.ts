import {CodeResult} from './code-result';

export interface PatientResult {
  sexUsed: boolean;
  birthdayUsed: boolean;
  departamentUsed: boolean;
  diagnoses: CodeResult[];
  procedures: CodeResult[];

  mdc: string;
  mdcDescription: string;

  drg: string;
  drgDescription: string;
  entgelt: number;
}

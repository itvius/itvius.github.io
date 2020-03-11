import {Sex} from './sex';

export class Patient {
  id: string;
  name: string;
  sex: Sex;
  birthday: string;
  departamentId: string;
  diagnoses;
  procedures;
  diagnosId;
}

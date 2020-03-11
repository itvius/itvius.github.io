import {Injectable} from '@angular/core';
import {Departament} from '../models/departament';
import {Patient} from '../models/patient';
import {PatientResult} from '../models/patient-result';
import {getRandomBool, getRandomCharacter, getRandomInt} from '../helpers/randomHelpers';
import {Sex} from '../models/sex';
import {CodeResult} from '../models/code-result';

@Injectable({
  providedIn: 'root'
})
export class PatientServiceService {

  constructor() {
  }


  calculatePatient(patient: Patient): PatientResult {
    const mdc = `${getRandomInt(1, 10)}`;
    const drg = `${getRandomCharacter()}${getRandomInt(0, 10)}${getRandomInt(0, 10)}${getRandomInt(0, 10)}`;


    return <PatientResult>{
      sexUsed: patient.sex !== Sex.undefined && getRandomBool(),
      birthdayUsed: patient.birthday && getRandomBool(),
      departamentUsed: patient.departamentId && getRandomBool(),
      diagnoses: patient.diagnoses.map((i) => <CodeResult>
        {
          used: i.used,
          description: `Diagnose code description ${i.name}`,
          flags: Array.from(Array(getRandomInt(0, 3)).keys()).map(j => `Flag ${j}`),
        }),
      procedures: patient.procedures.map((i) => <CodeResult>
        {
          used: i.used,
          description: `Procedure code description ${i.name}`,
          flags: Array.from(Array(getRandomInt(0, 3)).keys()).map(j => `Flag ${j}`),
          diagnosId: i.diagnosId,
        }),
      mdc: mdc,
      mdcDescription: `${mdc} Text Description`,
      drg: drg,
      drgDescription: `${drg} Text Description`,
      entgelt: Math.round(Math.random() * 10000.0)
    };
  }


  getDepartaments(): Departament[] {
    return Array.from(Array(10).keys()).map(id => (<Departament>
        {
          id: id.toString(),
          name: `Departament ${id}`
        }
    ));
  }
}




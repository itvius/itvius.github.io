import { Component, OnInit } from '@angular/core';
import {PatientServiceService} from '../../services/patient-service.service';
import {Patient} from '../../models/patient';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss']
})
export class ContentComponent implements OnInit {
  patient: Patient;
  departments;
  patientSex = [
    { id: 0, name: 'undefined' },
    { id: 1, name: 'man' },
    { id: 2, name: 'woman' },
  ];
  calculatePatient;
  diagnosesNoneUsed = [
    { id: 21, name: 'C30.0', used: true },
    { id: 22, name: 'R30.0', used: true },
    { id: 23, name: 'R31.0', used: true },
    { id: 24, name: 'C31.0', used: true },
  ];

  constructor(
    private patientService: PatientServiceService
  ) {
    this.patient = new Patient();
    this.patient.birthday = this.dateFormat(new Date(1986, 11, 12));
    this.patient.departamentId = this.patientService.getDepartaments()[0].id;
    this.patient.diagnoses = [
      { id: 0, name: 'R16.0', used: true },
      { id: 1, name: 'C17.0', used: true },
      { id: 2, name: 'C18.0', used: true },
      { id: 3, name: 'C19.0', used: true },
      { id: 4, name: 'R17.0', used: true },
      { id: 5, name: 'R18.0', used: true },
      { id: 6, name: 'R19.0', used: true },
      { id: 7, name: 'R20.0', used: true },
      { id: 8, name: 'C20.0', used: true },
      { id: 9, name: 'R21.0', used: true },
      { id: 10, name: 'C22.0', used: true },
      { id: 11, name: 'C23.0', used: true },
      { id: 12, name: 'R25.0', used: true },
      { id: 13, name: 'R26.0', used: true },
      { id: 14, name: 'C25.0', used: true },
      { id: 15, name: 'R27.0', used: true },
      { id: 16, name: 'C26.0', used: true },
      { id: 17, name: 'C27.0', used: true },
      { id: 18, name: 'R29.0', used: true },
      { id: 19, name: 'C28.0', used: true },
      { id: 20, name: 'C29.0', used: true },
    ];
    this.patient.procedures = [
      { id: 0, name: '3.300.1', used: true, diagnosId: 0 },
      { id: 1, name: '3.300.2', used: true, diagnosId: 1 },
      { id: 2, name: '3.400.1', used: true, diagnosId: 2 },
      { id: 3, name: '3.500.2', used: true, diagnosId: 3 },
      { id: 4, name: '3.600.1', used: true, diagnosId: 4 },
      { id: 5, name: '3.700.2', used: true, diagnosId: 5 },
      { id: 6, name: '3.800.1', used: true, diagnosId: 6 },
      { id: 7, name: '3.900.2', used: true, diagnosId: 7 },
      { id: 8, name: '3.310.1', used: true, diagnosId: 8 },
      { id: 9, name: '3.320.2', used: true, diagnosId: 9 },
      { id: 10, name: '3.330.1', used: true, diagnosId: 10 },
      { id: 11, name: '3.340.2', used: true, diagnosId: 11 },
      { id: 12, name: '3.350.1', used: true, diagnosId: 12 },
      { id: 13, name: '3.360.2', used: true, diagnosId: 13 },
      { id: 14, name: '3.370.1', used: true, diagnosId: 14 },
      { id: 15, name: '3.380.2', used: true, diagnosId: 15 },
      { id: 16, name: '3.390.1', used: true, diagnosId: 16 },
      { id: 17, name: '3.301.2', used: true, diagnosId: 17 },
      { id: 18, name: '3.302.1', used: true, diagnosId: 18 },
      { id: 19, name: '3.303.2', used: true, diagnosId: 19 },
      { id: 20, name: '3.304.1', used: true, diagnosId: 20 },
      { id: 21, name: '3.305.2', used: true, diagnosId: null },
      { id: 22, name: '3.306.1', used: true, diagnosId: null },
      { id: 23, name: '3.307.2', used: true, diagnosId: null },
      { id: 24, name: '3.308.1', used: true, diagnosId: null },
      { id: 25, name: '3.309.2', used: true, diagnosId: null },
      { id: 26, name: '3.300.3', used: true, diagnosId: null },
      { id: 27, name: '3.300.4', used: true, diagnosId: null },
      { id: 28, name: '3.300.5', used: true, diagnosId: null },
      { id: 29, name: '3.300.6', used: true, diagnosId: null },
    ];
    this.patient.id = '208123';
    this.patient.name = 'Vasya Pupkin';
    this.departments = this.patientService.getDepartaments();
    this.patient.sex = 0;
  }

  ngOnInit() {
    this.calculatePatient = this.patientService.calculatePatient(this.patient);
  }

  changeDataForCalculate () {
    this.calculatePatient = this.patientService.calculatePatient(this.patient);
  }

  dateFormat(date) {
    return '' + date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  }

  diagnosNumber(data) {
    return this.patient.diagnoses.find(el => el.id == data.diagnosId);
  }

  deleteDiagnos(data) {
    this.diagnosesNoneUsed.push(data);
    this.patient.procedures.forEach(el => {
      if (el.id === data.id) {
        el.diagnosId = null;
      }
    });
    this.patient.diagnoses.splice(this.patient.diagnoses.findIndex(element => element.id === data.id), 1);
    this.changeDataForCalculate();
  }
}

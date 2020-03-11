import { TestBed } from '@angular/core/testing';

import { PatientServiceService } from './patient-service.service';

describe('PatientServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PatientServiceService = TestBed.get(PatientServiceService);
    expect(service).toBeTruthy();
  });
});

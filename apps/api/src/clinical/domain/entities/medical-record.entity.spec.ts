import { MedicalRecord } from './medical-record.entity';

function recordParams(overrides: Partial<Parameters<typeof MedicalRecord.create>[0]> = {}) {
  return {
    petId: 'pet-1',
    appointmentId: 'appt-1',
    veterinarianId: 'vet-1',
    symptoms: 'Rascado frecuente, mal olor en el oído',
    diagnosis: 'Otitis leve en oído derecho',
    ...overrides,
  };
}

describe('MedicalRecord', () => {
  it('creates successfully with required fields', () => {
    const record = MedicalRecord.create(recordParams());
    expect(record.symptoms).toBe('Rascado frecuente, mal olor en el oído');
    expect(record.diagnosis).toBe('Otitis leve en oído derecho');
  });

  it('rejects empty symptoms (INV-MEDREC-004)', () => {
    expect(() => MedicalRecord.create(recordParams({ symptoms: '  ' }))).toThrow('INV-MEDREC-004');
  });

  it('rejects empty diagnosis (INV-MEDREC-002)', () => {
    expect(() => MedicalRecord.create(recordParams({ diagnosis: '' }))).toThrow('INV-MEDREC-002');
  });
});

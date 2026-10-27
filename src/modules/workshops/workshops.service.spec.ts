import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Workshop } from './entities/workshop.entity';
import { WorkshopsService } from './workshops.service';

const buildWorkshop = (overrides: Partial<Workshop> = {}): Workshop =>
  Object.assign(new Workshop(), {
    id: 1,
    name: 'Taller Centro',
    address: 'Calle 50',
    isActive: true,
    ...overrides,
  });

describe('WorkshopsService', () => {
  const repository = {
    existsBy: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data: Partial<Workshop>) => data),
    merge: jest.fn((entity: Workshop, data: Partial<Workshop>) =>
      Object.assign(entity, data),
    ),
    save: jest.fn((entity: Workshop) => Promise.resolve(entity)),
  };
  const service = new WorkshopsService(
    repository as unknown as Repository<Workshop>,
  );

  beforeEach(() => jest.clearAllMocks());

  it('por defecto lista solo los talleres activos', async () => {
    await service.findAll();
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('incluye los inactivos cuando se pide', async () => {
    await service.findAll(true);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('no permite dos talleres con el mismo nombre (409)', async () => {
    repository.existsBy.mockResolvedValue(true);
    await expect(
      service.create({ name: 'Taller Centro', address: 'Otra' }),
    ).rejects.toThrow(ConflictException);
  });

  it('inactiva un taller activo y rechaza inactivarlo dos veces', async () => {
    repository.findOneBy.mockResolvedValue(buildWorkshop());
    await expect(service.deactivate(1)).resolves.toMatchObject({
      isActive: false,
    });

    repository.findOneBy.mockResolvedValue(buildWorkshop({ isActive: false }));
    await expect(service.deactivate(1)).rejects.toThrow(/ya está inactivo/);
  });

  it('responde 404 si el taller no existe', async () => {
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
  });
});

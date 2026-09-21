import { prisma } from '../../utils/prisma';

export class VehiclesService {
  static async search(params: {
    type?: 'CAR' | 'BIKE' | 'ALL';
    city?: string;
    fuelType?: string;
    transmission?: string;
    maxDailyPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'popular';
  }) {
    const { type, city, fuelType, transmission, maxDailyPrice, sortBy } = params;

    const where: any = { isAvailable: true };

    if (type && type !== 'ALL') {
      where.type = type;
    }
    if (city) {
      where.city = { contains: city };
    }
    if (fuelType && fuelType !== 'ALL') {
      where.fuelType = fuelType;
    }
    if (transmission && transmission !== 'ALL') {
      where.transmission = transmission;
    }
    if (maxDailyPrice) {
      where.pricePerDay = { lte: Number(maxDailyPrice) };
    }

    let orderBy: any = { pricePerDay: 'asc' };
    if (sortBy === 'price_desc') {
      orderBy = { pricePerDay: 'desc' };
    } else if (sortBy === 'price_asc') {
      orderBy = { pricePerDay: 'asc' };
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy,
    });

    return vehicles.map((v) => ({
      ...v,
      images: JSON.parse(v.images),
    }));
  }

  static async getById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw { statusCode: 404, message: 'Vehicle not found.' };
    }

    return {
      ...vehicle,
      images: JSON.parse(vehicle.images),
    };
  }
}

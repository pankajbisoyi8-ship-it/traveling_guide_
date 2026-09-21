import { prisma } from '../../utils/prisma';

export class HotelsService {
  static async search(params: {
    destinationSlug?: string;
    destinationId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    amenities?: string[];
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular';
  }) {
    const {
      destinationSlug,
      destinationId,
      search,
      minPrice,
      maxPrice,
      minRating,
      amenities,
      sortBy = 'rating',
    } = params;

    const where: any = {};

    if (destinationSlug) {
      const dest = await prisma.destination.findUnique({
        where: { slug: destinationSlug },
      });
      if (dest) {
        where.destinationId = dest.id;
      }
    } else if (destinationId) {
      where.destinationId = destinationId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { destination: { name: { contains: search } } },
      ];
    }

    if (minRating) {
      where.rating = { gte: Number(minRating) };
    }

    let orderBy: any = { rating: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const hotels = await prisma.hotel.findMany({
      where,
      orderBy,
      include: {
        destination: {
          select: { id: true, name: true, slug: true, state: true, category: true },
        },
        rooms: true,
        reviews: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    let results = hotels.map((h) => {
      const parsedAmenities = JSON.parse(h.amenities) as string[];
      const lowestRoomPrice = h.rooms.length > 0 ? Math.min(...h.rooms.map((r) => r.pricePerNight)) : 0;

      return {
        ...h,
        images: JSON.parse(h.images),
        amenities: parsedAmenities,
        startingPrice: lowestRoomPrice,
        reviewCount: h._count.reviews,
        rooms: h.rooms.map((r) => ({
          ...r,
          amenities: JSON.parse(r.amenities),
          images: JSON.parse(r.images),
        })),
        reviews: h.reviews.map((rev) => ({
          id: rev.id,
          rating: rev.rating,
          comment: rev.comment,
          createdAt: rev.createdAt,
          user: rev.user,
        })),
      };
    });

    // Apply client-level filters for min/max price & amenities
    if (minPrice !== undefined) {
      results = results.filter((h) => h.startingPrice >= Number(minPrice));
    }
    if (maxPrice !== undefined) {
      results = results.filter((h) => h.startingPrice <= Number(maxPrice));
    }
    if (amenities && amenities.length > 0) {
      results = results.filter((h) =>
        amenities.every((reqAmenity) =>
          h.amenities.some((a: string) => a.toLowerCase().includes(reqAmenity.toLowerCase()))
        )
      );
    }

    if (sortBy === 'price_asc') {
      results.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.startingPrice - a.startingPrice);
    }

    return results;
  }

  static async getById(id: string) {
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        destination: true,
        rooms: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!hotel) {
      throw { statusCode: 404, message: 'Hotel not found.' };
    }

    return {
      ...hotel,
      images: JSON.parse(hotel.images),
      amenities: JSON.parse(hotel.amenities),
      destination: {
        ...hotel.destination,
        images: JSON.parse(hotel.destination.images),
      },
      reviewCount: hotel._count.reviews,
      rooms: hotel.rooms.map((r) => ({
        ...r,
        amenities: JSON.parse(r.amenities),
        images: JSON.parse(r.images),
      })),
      reviews: hotel.reviews.map((rev) => ({
        id: rev.id,
        rating: rev.rating,
        comment: rev.comment,
        createdAt: rev.createdAt,
        user: rev.user,
      })),
    };
  }

  static async addReview(userId: string, hotelId: string, rating: number, comment: string) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      throw { statusCode: 404, message: 'Hotel not found.' };
    }

    const review = await prisma.review.create({
      data: {
        userId,
        hotelId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Recompute average rating
    const allReviews = await prisma.review.findMany({
      where: { hotelId },
      select: { rating: true },
    });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.hotel.update({
      where: { id: hotelId },
      data: { rating: Number(avg.toFixed(1)) },
    });

    return review;
  }
}

import { InterestRepository, Interest, UserInterest } from '../repositories/InterestRepository';
import { AppError } from '../utils/AppError';

export interface InterestResponse {
  id: number;
  name: string;
  tag: string;
}

export interface UserInterestResponse {
  id: number;
  name: string;
  tag: string;
  added_at: string;
}

export interface UserInterestsListResponse {
  interests: UserInterestResponse[];
  count: number;
  max_interests: number;
}

export interface CreateInterestRequest {
  name: string;
  tag?: string;
}

export interface UpdateUserInterestsRequest {
  interest_ids: number[];
}

export class InterestService {
  private static readonly MAX_INTERESTS_PER_USER = 10;

  // ===== INTEREST MANAGEMENT =====

  static async getAllInterests(): Promise<{ interests: InterestResponse[] }> {
    const interests = await InterestRepository.findAll();

    return {
      interests: interests.map(this.formatInterestResponse),
    };
  }

  static async searchInterests(query: string): Promise<{ interests: InterestResponse[] }> {
    if (!query || query.trim().length < 1) {
      throw new AppError('Search query must be at least 1 character', 400);
    }

    const interests = await InterestRepository.search(query.trim());

    return {
      interests: interests.map(this.formatInterestResponse),
    };
  }

  static async createInterest(data: CreateInterestRequest): Promise<InterestResponse> {
    const { name } = data;
    let { tag } = data;

    // Validate and normalize name
    const normalizedName = InterestRepository.normalizeInterestName(name);
    if (!InterestRepository.validateInterestName(normalizedName)) {
      throw new AppError('Interest name must be 2-30 characters and contain only letters and spaces', 400);
    }

    // Generate tag if not provided
    if (!tag) {
      tag = InterestRepository.generateTag(normalizedName);
    } else {
      tag = tag.toLowerCase().trim();
    }

    // Validate tag
    if (!InterestRepository.validateTag(tag)) {
      throw new AppError('Interest tag must be 1-50 characters and contain only lowercase letters, numbers, and underscores', 400);
    }

    // Check if interest already exists
    const existingByName = await InterestRepository.findByName(normalizedName);
    if (existingByName) {
      return this.formatInterestResponse(existingByName);
    }

    const existingByTag = await InterestRepository.findByTag(tag);
    if (existingByTag) {
      throw new AppError(`Interest with tag "${tag}" already exists`, 409);
    }

    // Create new interest
    const interest = await InterestRepository.create({
      name: normalizedName,
      tag,
    });

    return this.formatInterestResponse(interest);
  }

  // ===== USER INTERESTS MANAGEMENT =====

  static async getUserInterests(userId: number): Promise<UserInterestsListResponse> {
    const interests = await InterestRepository.findUserInterests(userId);

    return {
      interests: interests.map(this.formatUserInterestResponse),
      count: interests.length,
      max_interests: this.MAX_INTERESTS_PER_USER,
    };
  }

  static async addUserInterest(userId: number, interestId: number): Promise<UserInterestResponse> {
    // Check if interest exists
    const interest = await InterestRepository.findById(interestId);
    if (!interest) {
      throw new AppError('Interest not found', 404);
    }

    // Check if user already has this interest
    const hasInterest = await InterestRepository.hasUserInterest(userId, interestId);
    if (hasInterest) {
      throw new AppError('User already has this interest', 409);
    }

    // Check interest limit
    const currentCount = await InterestRepository.countUserInterests(userId);
    if (currentCount >= this.MAX_INTERESTS_PER_USER) {
      throw new AppError(`Maximum ${this.MAX_INTERESTS_PER_USER} interests allowed per user`, 400);
    }

    // Add interest to user
    await InterestRepository.addUserInterest(userId, interestId);

    // Return the added interest with timestamp
    const userInterests = await InterestRepository.findUserInterests(userId);
    const addedInterest = userInterests.find(ui => ui.id === interestId);

    if (!addedInterest) {
      throw new AppError('Failed to add interest', 500);
    }

    return this.formatUserInterestResponse(addedInterest);
  }

  static async removeUserInterest(userId: number, interestId: number): Promise<void> {
    const removed = await InterestRepository.removeUserInterest(userId, interestId);

    if (!removed) {
      throw new AppError('Interest not found or not associated with user', 404);
    }
  }

  static async updateUserInterests(userId: number, data: UpdateUserInterestsRequest): Promise<UserInterestsListResponse> {
    const { interest_ids } = data;

    // Validate interest IDs array
    if (!Array.isArray(interest_ids)) {
      throw new AppError('interest_ids must be an array', 400);
    }

    // Check interest limit
    if (interest_ids.length > this.MAX_INTERESTS_PER_USER) {
      throw new AppError(`Maximum ${this.MAX_INTERESTS_PER_USER} interests allowed per user`, 400);
    }

    // Remove duplicates
    const uniqueInterestIds = [...new Set(interest_ids)];

    // Validate that all interests exist
    if (uniqueInterestIds.length > 0) {
      const existingInterests = await Promise.all(
        uniqueInterestIds.map(id => InterestRepository.findById(id))
      );

      const nonExistentIds = uniqueInterestIds.filter((id, index) => !existingInterests[index]);
      if (nonExistentIds.length > 0) {
        throw new AppError(`Interests not found: ${nonExistentIds.join(', ')}`, 404);
      }
    }

    // Replace user interests
    await InterestRepository.replaceUserInterests(userId, uniqueInterestIds);

    // Return updated interests
    return this.getUserInterests(userId);
  }

  static async addUserInterestByName(userId: number, interestName: string): Promise<UserInterestResponse> {
    // Validate and normalize name
    const normalizedName = InterestRepository.normalizeInterestName(interestName);
    if (!InterestRepository.validateInterestName(normalizedName)) {
      throw new AppError('Interest name must be 2-30 characters and contain only letters and spaces', 400);
    }

    // Generate tag
    const tag = InterestRepository.generateTag(normalizedName);

    // Find or create interest
    const interest = await InterestRepository.findOrCreate(normalizedName, tag);

    // Add to user interests
    return this.addUserInterest(userId, interest.id);
  }

  // ===== UTILITY METHODS =====

  private static formatInterestResponse(interest: Interest): InterestResponse {
    return {
      id: interest.id,
      name: interest.name,
      tag: interest.tag,
    };
  }

  private static formatUserInterestResponse(userInterest: UserInterest): UserInterestResponse {
    return {
      id: userInterest.id,
      name: userInterest.name,
      tag: userInterest.tag,
      added_at: userInterest.added_at.toISOString(),
    };
  }

  static validateInterestName(name: string): boolean {
    return InterestRepository.validateInterestName(name);
  }

  static generateTag(name: string): string {
    return InterestRepository.generateTag(name);
  }
}

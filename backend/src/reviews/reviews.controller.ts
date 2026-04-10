import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('products')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':productId/reviews')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a product review',
    description:
      'Creates a review for the given product. Requires a valid JWT; the review is linked to the authenticated user. New reviews start as not approved.',
  })
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'Product being reviewed.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiCreatedResponse({
    description: 'Review created (pending approval).',
    type: Review,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Bearer token.',
  })
  @ApiForbiddenResponse({
    description: 'Token valid but not allowed to perform this action.',
  })
  @ApiNotFoundResponse({
    description: 'Product or user record not found.',
  })
  createReview(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUserId() userId: string,
  ): Promise<Review> {
    return this.reviewsService.create(productId, dto, userId);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user-role.enum';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { ApproveReviewResponseDto } from './dto/approve-review.response.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListProductReviewsQueryDto } from './dto/list-product-reviews.query.dto';
import { ProductReviewResponseDto } from './dto/product-review-response.dto';
import { ReviewAuthorResponseDto } from './dto/review-author-response.dto';
import { Review } from './entities/review.entity';
import { ProductReviewsListingGuard } from './guards/product-reviews-listing.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiExtraModels(
  ProductReviewResponseDto,
  ReviewAuthorResponseDto,
  ApproveReviewResponseDto,
)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  @UseGuards(ProductReviewsListingGuard)
  @ApiOperation({
    summary: 'List reviews for a product',
    description:
      'By default (`approvedOnly` true or omitted) returns **approved** reviews only; authentication is not required. ' +
      'Set `approvedOnly=false` to include pending reviews; this requires a Bearer token for a user with the **product_manager** role (otherwise 401/403).',
  })
  @ApiParam({
    name: 'productId',
    format: 'uuid',
    description: 'Product whose reviews are listed.',
  })
  @ApiQuery({
    name: 'approvedOnly',
    required: false,
    type: Boolean,
    description:
      'If true or omitted, only moderated (approved) reviews. If false, include unapproved (product managers only).',
    example: true,
  })
  @ApiOkResponse({
    description: 'List of reviews with masked author info (no raw user ids).',
    type: ProductReviewResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description:
      'Missing or invalid Bearer token when `approvedOnly=false`.',
  })
  @ApiForbiddenResponse({
    description:
      'Authenticated user does not have the product_manager role when `approvedOnly=false`.',
  })
  @ApiNotFoundResponse({ description: 'Product id does not exist.' })
  listProductReviews(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Query() query: ListProductReviewsQueryDto,
  ): Promise<ProductReviewResponseDto[]> {
    const approvedOnly = query.approvedOnly !== false;
    return this.reviewsService.findByProduct(productId, approvedOnly);
  }

  @Post('products/:productId/reviews')
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

  @Patch('reviews/:reviewId/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ProductManager)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Approve a review (product managers)',
    description:
      'Sets the review’s moderated flag to approved. **product_manager** role required. ' +
      'Idempotent: approving an already-approved review returns 200 without error.',
  })
  @ApiParam({
    name: 'reviewId',
    format: 'uuid',
    description: 'Review to approve.',
  })
  @ApiOkResponse({
    description: 'Review is now approved (or was already approved).',
    type: ApproveReviewResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Bearer token.',
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user does not have the product_manager role.',
  })
  @ApiNotFoundResponse({ description: 'Review id does not exist.' })
  approveReview(
    @Param('reviewId', new ParseUUIDPipe({ version: '4' })) reviewId: string,
  ): Promise<ApproveReviewResponseDto> {
    return this.reviewsService.approve(reviewId);
  }
}

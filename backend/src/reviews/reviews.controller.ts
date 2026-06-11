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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';

import { CurrentUser } from './decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListModerationReviewsQueryDto } from './dto/list-moderation-reviews-query.dto';
import { ListProductReviewsQueryDto } from './dto/list-reviews-query.dto';
import { UpdateReviewCommentDto } from './dto/update-review-comment.dto';
import { ReviewStatus } from './entities/review-status.enum';
import { Review } from './entities/review.entity';
import { ProductManagerRoleGuard } from '../common/auth/product-manager-role.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a product review',
    description:
      'Authenticated customers can submit rating for delivered products only.',
  })
  @ApiCreatedResponse({ description: 'Review created.', type: Review })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiNotFoundResponse({ description: 'Referenced product does not exist.' })
  create(
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewsService.create(user.sub, dto);
  }

  @Patch('product/:productId/comment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add comment to existing rating',
    description:
      'Adds or updates a comment for the current user rating. Comment goes to moderation queue.',
  })
  addComment(
    @CurrentUser() user: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Body() dto: UpdateReviewCommentDto,
  ): Promise<Review> {
    return this.reviewsService.addComment(user.sub, productId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, ProductManagerRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List reviews for moderation',
    description:
      'Product managers only. Defaults to pending reviews; use `status` to filter.',
  })
  @ApiOkResponse({ description: 'Reviews matching the filter.', type: [Review] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiForbiddenResponse({ description: 'Caller is not a product manager.' })
  listForModeration(
    @Query() query: ListModerationReviewsQueryDto,
  ): Promise<Review[]> {
    const status = query.status ?? ReviewStatus.PENDING;
    return this.reviewsService.listForModeration(status);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, ProductManagerRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a pending review' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Review approved.', type: Review })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiForbiddenResponse({ description: 'Caller is not a product manager.' })
  @ApiNotFoundResponse({ description: 'Review id does not exist.' })
  @ApiConflictResponse({ description: 'Review is not in pending state.' })
  approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Review> {
    return this.reviewsService.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, ProductManagerRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a pending review' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Review rejected.', type: Review })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiForbiddenResponse({ description: 'Caller is not a product manager.' })
  @ApiNotFoundResponse({ description: 'Review id does not exist.' })
  @ApiConflictResponse({ description: 'Review is not in pending state.' })
  reject(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Review> {
    return this.reviewsService.reject(id);
  }

  @Get('product/:productId')
  @ApiOperation({
    summary: 'List approved reviews for a product',
    description:
      'Returns reviews for the given product. Only approved reviews are returned by default.',
  })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiOkResponse({ description: 'List of visible reviews.', type: [Review] })
  listByProduct(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Query() query: ListProductReviewsQueryDto,
  ): Promise<Review[]> {
    const status = query.status ?? ReviewStatus.APPROVED;
    return this.reviewsService.listByProduct(productId, status);
  }

  @Get('product/:productId/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyReviewForProduct(
    @CurrentUser() user: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<Review | null> {
    return this.reviewsService.getMineForProduct(user.sub, productId);
  }
}

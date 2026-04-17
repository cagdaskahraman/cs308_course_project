import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from './decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListProductReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewStatus } from './entities/review-status.enum';
import { Review } from './entities/review.entity';
import { JwtPayload, ReviewsJwtGuard } from './guards/reviews-jwt.guard';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ReviewsJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit a product review',
    description:
      'Authenticated customers can submit a review. The review is created in `pending` state and becomes visible only after moderation.',
  })
  @ApiCreatedResponse({ description: 'Review created in pending state.', type: Review })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @ApiNotFoundResponse({ description: 'Referenced product does not exist.' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto): Promise<Review> {
    return this.reviewsService.create(user.sub, dto);
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
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Review } from './entities/review.entity';
import { ProductReviewsListingGuard } from './guards/product-reviews-listing.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Product, User]),
    AuthModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ProductReviewsListingGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}

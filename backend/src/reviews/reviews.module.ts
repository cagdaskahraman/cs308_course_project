import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../products/entities/product.entity';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Product])],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

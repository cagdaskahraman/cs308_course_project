import { Controller, Get } from '@nestjs/common';

@Controller()
export class HelloController {
  @Get('hello')
  getHello(): string {
    return 'Hello World';
  }
}

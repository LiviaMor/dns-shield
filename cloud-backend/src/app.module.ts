import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { TopologyModule } from './topology/topology.module';
import { ReportsModule } from './reports/reports.module';
import { OnboardingModule } from './onboarding/onboarding.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    KnowledgeModule,
    TopologyModule,
    ReportsModule,
    OnboardingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

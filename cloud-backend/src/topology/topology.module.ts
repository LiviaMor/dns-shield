import { Module } from '@nestjs/common';
import { TopologyController } from './topology.controller';
import { TopologyService } from './topology.service';
import { AnalyzerService } from './analyzer.service';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [OnboardingModule],
  controllers: [TopologyController],
  providers: [TopologyService, AnalyzerService],
})
export class TopologyModule {}

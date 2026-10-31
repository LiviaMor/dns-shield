import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIP,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DeviceDto {
  @IsIP()
  ip!: string;

  @IsOptional()
  @IsString()
  mac?: string;

  @IsOptional()
  @IsString()
  hostname?: string;

  @IsOptional()
  @IsString()
  vendor_hint?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  open_ports?: number[];

  @IsOptional()
  @IsString()
  classification?: string;

  @IsOptional()
  @IsBoolean()
  is_gateway?: boolean;
}

export class TopologyDto {
  @IsString()
  tenant_id!: string;

  @IsOptional()
  @IsString()
  gateway?: string | null;

  @IsString()
  cidr!: string;

  @IsString()
  scanned_at!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceDto)
  devices!: DeviceDto[];
}

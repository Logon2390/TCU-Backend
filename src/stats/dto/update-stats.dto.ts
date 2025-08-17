import { PartialType } from "@nestjs/mapped-types";
import { CreateStatsDto } from "./create-stats.dto";
export class UpdateStatsDto extends PartialType(CreateStatsDto) {


}
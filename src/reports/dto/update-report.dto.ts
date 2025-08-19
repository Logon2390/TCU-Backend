import { PartialType } from "@nestjs/mapped-types"

import {
    GenerateReportDto
} from "./create-report.dto"

export class UpdateReportDto extends PartialType(GenerateReportDto) { }
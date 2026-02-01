import { parse } from "csv-parse/sync"
import * as path from "node:path"
import * as fs from "node:fs"

import { Line, StopGroup, StopPoint, WLData } from "../src/types"

const files = {
    lines: "lines.csv",
    stopPoints: "stopPoints.csv",
    routes: "routes.csv",
    stopGroups: "stopGroups.csv"
}

const data: WLData = {
    lines: [],
    stopPoints: [],
    stopGroups: []
}

/**
 * Read the provided CSV file from the data/csv folder
 * and parse the lines.
 * @param filename
 */
function readCsv(filename: string): unknown[] {
    const file = path.join("data", "csv", filename)
    const text = fs.readFileSync(file, "utf-8")

    return parse(text, {
        columns: true,
        delimiter: ";",
        skip_empty_lines: true,
        skip_records_with_error: true,
        skip_records_with_empty_values: true,
        trim: true,
        bom: true,
        on_record: (record) => {
            const hasEmpty = Object.values(record).some(
                v => typeof v === "string" && v.trim() === ""
            )

            if (hasEmpty) return null
            return record
        },
    }) as unknown[]
}

/**
 * Parse a string into a valid integer.
 * @param s
 * @param field The field currently being parsed (only for error logging)
 */
function toInt(s: string, field: string): number {
    const n = Number.parseInt(s)
    if (Number.isNaN(n) || !Number.isFinite(n)) throw new Error(`Invalid int value: "${s}" (${field})`)
    return n
}

/**
 * Parse a string into a valid float.
 * @param s
 * @param field The field currently being parsed (only for error logging)
 */
function toFloat(s: string, field: string): number {
    const n = Number.parseFloat(s)
    if (Number.isNaN(n) || !Number.isFinite(n)) throw new Error(`Invalid float value: "${s}" (${field})`)
    return n
}

/**
 * Parse a string into a valid boolean.
 * Only accepts 1/0 -> true/false.
 * @param s
 * @param field The field currently being parsed (only for error logging)
 */
function toBoolean(s: string, field: string): boolean {
    const b = s
    if (b === "1") return true
    if (b === "0") return false
    throw new Error(`Invalid boolean value: "${s}" (${field})`)
}

/**
 * Read the transit line entries and
 * parse / store them.
 */
function readLines() {
    const records = readCsv(files.lines)
    for (const record of records) {
        const line: Line = {
            id: toInt(record["LineID"], "LineID"),
            name: record["LineText"],
            realtime: toBoolean(record["Realtime"], "Realtime"),
            vehicle: record["MeansOfTransport"]
        }
        data.lines.push(line)
    }
}

/**
 * Read the routes of each line and map stop id -> list of lines
 * passing through it.
 */
function readStopMap(): Map<number, Set<number>> {
    const stopMap = new Map<number, Set<number>>()
    const records = readCsv(files.routes)
    for (const record of records) {
        const lineId = toInt(record["LineID"], "LineID")
        const stopId = toInt(record["StopID"], "StopID")

        if (!stopMap.has(stopId)) stopMap.set(stopId, new Set<number>())
        stopMap.get(stopId).add(lineId)
    }

    return stopMap
}

/**
 * Read the stop point entries, map them to
 * the lines stopping there and store them.
 */
function readStopPoints() {
    const stopMap = readStopMap()
    const records = readCsv(files.stopPoints)
    for (const record of records) {
        const stopId = toInt(record["StopID"], "StopID")
        const stopPoint: StopPoint = {
            id: stopId,
            diva: toInt(record["DIVA"], "DIVA"),
            name: record["StopText"],
            municipality: record["Municipality"],
            municipalityId: toInt(record["MunicipalityID"], "MunicipalityID"),
            longitude: toFloat(record["Longitude"], "Longitude"),
            latitude: toFloat(record["Latitude"], "Latitude"),
            lines: Array.from(stopMap.get(stopId) ?? [])
        }
        data.stopPoints.push(stopPoint)
    }
}

/**
 * Read the stop group entries, map them to
 * the stop points contained in that area code
 * and store them.
 */
function readStopGroups() {
    const divaMap = new Map<number, Set<number>>()
    for (const stopPoint of data.stopPoints) {
        if (!divaMap.has(stopPoint.diva)) divaMap.set(stopPoint.diva, new Set<number>())
        divaMap.get(stopPoint.diva).add(stopPoint.id)
    }

    const records = readCsv(files.stopGroups)
    for (const record of records) {
        const diva = toInt(record["DIVA"], "DIVA")
        const stopGroup: StopGroup = {
            diva: diva,
            name: record["PlatformText"],
            municipality: record["Municipality"],
            municipalityId: toInt(record["MunicipalityID"], "MunicipalityID"),
            longitude: toFloat(record["Longitude"], "Longitude"),
            latitude: toFloat(record["Latitude"], "Latitude"),
            stops: Array.from(divaMap.get(diva) ?? [])
        }
        data.stopGroups.push(stopGroup)
    }
}

////////////////////
////////////////////
////////////////////

readLines()
readStopPoints()
readStopGroups()

fs.writeFileSync(path.join("data", "wl-data.json"), JSON.stringify(data, null, 2), "utf-8")
// The various vehicle types that lines can be
export type Vehicle =
    "ptMetro" |
    "ptTram" |
    "ptTramWLB" |
    "ptRufBus" |
    "ptBusCity" |
    "ptBusNight" |
    "ptTrainS"

/**
 * A transit line entry containing the relevant information.
 * The field "sortingHelp" has been omitted, and some fields
 * have been renamed
 */
export type Line = {
    id: number,
    name: string,
    realtime: boolean,
    vehicle: Vehicle
}

/**
 * One stop point, sometimes for one line, sometimes for
 * multiple. Multiple stop points nearby are contained
 * in one stop group (see below). Each stop point also stores
 * which lines stop at it.
 */
export type StopPoint = {
    id: number,
    diva: number,
    name: string,
    municipality: string,
    municipalityId: number,
    longitude: number,
    latitude: number,
    lines: number[]
}

/**
 * One stop group, housing multiple stop points in
 * the same area.
 */
export type StopGroup = {
    diva: number,
    name: string,
    municipality: string,
    municipalityId: number,
    longitude: number,
    latitude: number,
    stops: number[], // stop IDs
}

/**
 * The type of the data as a whole, as it is in one JSON file.
 */
export type WLData = {
    lines: Line[],
    stopPoints: StopPoint[],
    stopGroups: StopGroup[]
}
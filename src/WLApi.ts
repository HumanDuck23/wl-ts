import { Line, StopGroup, StopPoint, WLData } from "./types/static"

/**
 * The Wiener Linien API class.
 * This class wraps the static JSON
 * data and provides easy methods to
 * query it, as well as the ability
 * to monitor realtime data for stops
 * as desired.
 */
export class WLApi {
    private readonly lines: Line[] = []
    private readonly linesById: Map<number, Line>

    private readonly stopPoints: StopPoint[] = []
    private readonly stopPointsById: Map<number, StopPoint>

    private readonly stopGroups: StopGroup[] = []
    private readonly stopGroupsByDiva: Map<number, StopGroup>

    constructor(private readonly data: WLData) {
        // Create maps and arrays for faster accessing
        this.lines = data.lines
        this.linesById = new Map(this.lines.map(l => [l.id, l]))

        this.stopPoints = data.stopPoints
        this.stopPointsById = new Map(this.stopPoints.map(s => [s.id, s]))

        this.stopGroups = data.stopGroups
        this.stopGroupsByDiva = new Map(this.stopGroups.map(g => [g.diva, g]))
    }

    /**
     * Get all lines
     */
    getLines(): Line[] {
        return this.lines
    }

    /**
     * Get a line by its ID
     * (e.g. tram line "1" has id 101)
     * @param id
     */
    getLineById(id: number): Line | null {
        return this.linesById.get(id) ?? null
    }

    /**
     * Get all stop points
     */
    getStopPoints(): StopPoint[] {
        return this.stopPoints
    }

    /**
     * Get a stop point by its ID
     * @param id
     */
    getStopPointById(id: number): StopPoint | null {
        return this.stopPointsById.get(id) ?? null
    }

    /**
     * Get all stop points belonging to
     * a specific stop group (DIVA)
     * @param diva
     */
    getStopPointsByDiva(diva: number): StopPoint[] {
        const stops: StopPoint[] = []
        const group = this.getStopGroupByDiva(diva)
        if (!group) return []
        for (const stopId of group.stops) {
            const point = this.getStopPointById(stopId)
            if (!point) continue
            stops.push(point)
        }
        return stops
    }

    /**
     * Get all stop points
     */
    getStopGroups(): StopGroup[] {
        return this.stopGroups
    }

    /**
     * Get a stop point by its ID
     * @param diva
     */
    getStopGroupByDiva(diva: number): StopGroup | null {
        return this.stopGroupsByDiva.get(diva) ?? null
    }
}
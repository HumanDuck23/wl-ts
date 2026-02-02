import { Line, StopGroup, StopPoint, WLData } from "./types/static"
import { WienerLinienResponse, WienerLinienResponseSchema } from "./types/realtime"
import { setInterval } from "node:timers"

type Listener = (data: WienerLinienResponse) => void

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

    private currentData: WienerLinienResponse | null = null
    private monitoredDivas: Set<number> = new Set()
    private updateInterval: NodeJS.Timeout | null = null
    private listeners: Set<Listener> = new Set()

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
     * Subscribe to updates for realtime data.
     * Data is returned as a whole, you must traverse
     * it yourself for relevant information.
     * @param listener
     * @returns The unsubscribe method (call the return value to stop listening to realtime updates)
     */
    subscribe(listener: Listener): () => void {
        this.listeners.add(listener)

        if (this.currentData) {
            listener(this.currentData)
        }

        return () => {
            this.listeners.delete(listener)
        }
    }

    /**
     * Start monitoring a stop group (DIVA)
     * @param diva
     */
    watch(diva: number) {
        this.monitoredDivas.add(diva)
    }

    /**
     * Stop monitoring a stop group (DIVA)
     * @param diva
     */
    unwatch(diva: number) {
        this.monitoredDivas.delete(diva)
    }

    /**
     * Start polling realtime data.
     * @param pollingRate
     */
    startPolling(pollingRate: number = 30) {
        if (this.updateInterval !== null) return
        if (pollingRate < 15) console.error(`Please use a polling rate of 15+ seconds!`)
        else {
            console.log("starting polling x2")
            this.updateInterval = setInterval(() => {
                console.log("polling")
                this.poll()
            }, pollingRate * 1000)
        }
    }

    /**
     * Stop polling realtime data.
     */
    stopPolling() {
        if (this.updateInterval === null) return
        clearTimeout(this.updateInterval)
    }

    /**
     * Method that polls the Wiener Linien
     * api for the monitored DIVAS, parses
     * the response and stores it.
     * @private
     */
    private poll() {
        const url = "https://www.wienerlinien.at/ogd_realtime/monitor"
        const params = new URLSearchParams()
        params.append("activateTrafficInfo", "stoerunglang")
        params.append("activateTrafficInfo", "stoerungkurz")
        params.append("activateTrafficInfo", "aufzugsinfo")
        params.append("activateTrafficInfo", "fahrtreppeninfo")
        params.append("activateTrafficInfo", "information")

        for (const monitoredDiva of this.monitoredDivas) {
            params.append("diva", monitoredDiva.toString())
        }

        const finalUrl = `${url}?${params.toString()}`
        fetch(finalUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        })
            .then(res => {
                if (!res.ok) {
                    console.error(`Received status ${res.status} - ${res.statusText}!`)
                } else {
                    res.json()
                        .then(data => {
                            try {
                                const parsed = WienerLinienResponseSchema.parse(data)
                                this.currentData = parsed
                                this.listeners.forEach(l => {
                                    l(parsed)
                                })
                            } catch (e) {
                                console.error("Error parsing data: ", e)
                            }
                        })
                        .catch(err => {
                            console.error("Error parsing JSON response: ", err)
                        })
                }
            })
            .catch(err => {
                console.error("Error requesting realtime data: ", err)
            })
    }

    //////////////////////////////////////////////
    //////////////////////////////////////////////
    //////////////////////////////////////////////

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
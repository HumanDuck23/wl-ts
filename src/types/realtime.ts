import * as z from "zod"

/**
 * Schema defining the traffic info categories specified by the API.
 * A category has an ID, a name and a title. Some metadata is ignored.
 */
export const TrafficInfoCategorySchema = z.object({
    id: z.int().nonnegative(),
    name: z.string(),
    title: z.string()
})

/**
 * Schema defining a specific piece of information on traffic, e.g. an outage etc.
 */
export const TrafficInfoSchema = z.object({
    refTrafficInfoCategoryId: z.int().nonnegative(),
    title: z.string(),
    description: z.string(),
    time: z.object({
        start: z.string(),
        end: z.string()
    }),
    relatedLines: z.array(z.string()),
    relatedStops: z.array(z.int().nonnegative())
})

/**
 * Schema for a single departure in a monitored line.
 * Contains departure
 */
export const DepartureSchema = z.object({
    departureTime: z.object({
        timePlanned: z.string(),
        timeReal: z.string().optional(),
        countdown: z.int().nonnegative()
    }),
    vehicle: z.object({
        name: z.string(),
        towards: z.string(),
        direction: z.string(), // "H" or "R"
        barrierFree: z.boolean(),
        foldingRamp: z.boolean().optional(),
        realtimeSupported: z.boolean(),
        trafficjam: z.boolean(),
        type: z.string(),
        lineId: z.int().nonnegative().optional()
    }).optional()
})

/**
 * Schema for a monitored line. Contains info on the line and the next
 * departures as provided by the API. Each departure entry also contains
 * some info on the line, as individual departures might deviate
 * from the standard (e.g. early terminal station for a specific vehicle)
 */
export const MonitoredLineSchema = z.object({
    name: z.string(),
    towards: z.string(),
    direction: z.string(), // "H" or "R" to distinguish the two directions
    barrierFree: z.boolean().optional(),
    realtimeSupported: z.boolean().optional(), // sometimes false when it's not supposed to be? not sure about this one
    trafficjam: z.boolean().optional(),
    type: z.string(),
    lineId: z.int().nonnegative().optional(), // why is this optinal Wiener Linien ;-;
    departures: z.object({
        departure: z.array(DepartureSchema).optional()
    })
})

/**
 * Schema for one of the stop monitor objects. Contains info on the stop as well
 * as the departures for it.
 */
export const StopMonitorSchema = z.object({
    locationStop: z.object({
        properties: z.object({
            name: z.string(),
            title: z.string() // other data is ALSO stored in this BUT methods for static data already exist in the api, so extracting is not needed past DIVA actually
        })
    }),
    lines: z.array(MonitoredLineSchema).optional()
})

/**
 * Schema for the entire API response. Stores monitors, traffic infos
 * and traffic info categories. Ignores e.g. traffic info category groups.
 */
export const WienerLinienResponseSchema = z.object({
    data: z.object({
        trafficInfoCategories: z.array(TrafficInfoCategorySchema).optional(),
        trafficInfos: z.array(TrafficInfoSchema).optional(),
        monitors: z.array(StopMonitorSchema)
    })
})

export type TrafficInfoCategory = z.infer<typeof TrafficInfoCategorySchema>
export type TrafficInfo = z.infer<typeof TrafficInfoSchema>
export type Departure = z.infer<typeof DepartureSchema>
export type MonitoredLine = z.infer<typeof MonitoredLineSchema>
export type StopMonitor = z.infer<typeof StopMonitorSchema>
export type WienerLinienResponse = z.infer<typeof WienerLinienResponseSchema>
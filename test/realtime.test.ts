import { describe, expect, it } from "vitest"

import { WienerLinienResponse, WienerLinienResponseSchema } from "../src/types/realtime"
import tmpJson from "../tmp.json"
import jsonData from "../data/wl-data.json"
import { WLApi } from "../src/WLApi"

const LIVE = process.env.LIVE === "1"

describe("test parsing realtime data from example json", () => {
    it("test schema", () => {
        // dont crash here
        const data = WienerLinienResponseSchema.parse(tmpJson)
    })
})

describe("test realtime monitoring", () => {
    (LIVE ? it : it.skip)("monitors Brüßlgasse (1 request)", { timeout: 0 }, async () => {
        // @ts-ignore
        const api = new WLApi(jsonData)
        api.watch(60200179)

        const first = new Promise<WienerLinienResponse>((resolve) => {
            const unsub = api.subscribe((data) => {
                unsub()
                api.stopPolling()
                resolve(data)
            })
        })

        console.log("starting polling")

        api.startPolling(15)

        const data = await first
        expect(data.data.monitors.length).toBeGreaterThan(0)

        const monitors = data.data.monitors
        for (const monitor of monitors) {
            console.log(`=========== ${monitor.locationStop.properties.title} ===========`)

            expect(monitor.lines).toBeTruthy
            if (monitor.lines == undefined) throw new Error("monitor.lines is undefined")
            expect(monitor.lines?.length).toBeGreaterThan(0)

            for (const line of monitor.lines) {
                console.log(`${line.name} -> ${line.towards}`)
                const departureTimes: string[] = []

                const departures = line.departures.departure ?? []
                for (const d of departures) {
                    const timePlanned = d.departureTime.timePlanned
                    const timeReal = d.departureTime.timeReal ?? null
                    const countdown = d.departureTime.countdown

                    let str = `${countdown}`
                    if (timeReal) {
                        const d1 = new Date(timePlanned)
                        const d2 = new Date(timeReal)
                        const offset = (d2.getTime() - d1.getTime()) / 60000
                        const sgn = offset > 0 ? "+" : "-"
                        str += `(${sgn}${offset.toFixed(2)})`
                    }
                    departureTimes.push(str)
                }
                console.log(`Next departures: ${departureTimes.join(", ")}`)
            }
        }

        console.log(data.data.monitors)
    })
})
import { describe, expect, it } from "vitest"

import jsonData from "../data/wl-data.json"
import { WLApi } from "../src/WLApi"

describe("test static data", () => {
    it("load data and test lines", () => {
        // @ts-ignore
        const api = new WLApi(jsonData)

        const lines = api.getLines()
        expect(lines.length).toBeGreaterThan(0)

        const u1 = lines.find(l => l.name === "U1")
        expect(u1).toBeTruthy()

        const u1ById = api.getLineById(301)
        expect(u1ById).toBeTruthy()
        expect(u1).toEqual(u1ById)
    })

    it("load data and test stop points/groups", () => {
        // @ts-ignore
        const api = new WLApi(jsonData)

        const stopPoints = api.getStopPoints()
        const karlsplatz = stopPoints.find(s => s.name === "Karlsplatz")
        expect(karlsplatz).toBeTruthy()
        expect(karlsplatz?.lines?.length).toBeGreaterThan(0)

        const kpGroup = api.getStopGroupByDiva(karlsplatz!!.diva)
        expect(kpGroup).toBeTruthy()
        expect(kpGroup?.stops.includes(karlsplatz?.id ?? 0)).toBeTruthy()

        const kpPoints = api.getStopPointsByDiva(kpGroup!!.diva)
        expect(kpPoints.length).toBeGreaterThan(0)
        expect(kpPoints.includes(karlsplatz!!)).toBeTruthy()
    })

    it("full stop information from static data", () => {
        // @ts-ignore
        const api = new WLApi(jsonData)

        const vt = api.getStopPoints().find(s => s.name.includes("Volkstheater"))
        expect(vt).toBeTruthy()

        const vtg = api.getStopGroupByDiva(vt!!.diva)
        expect(vtg).toBeTruthy()

        console.log(`===== ${vtg!!.name} (${vtg!!.municipality}) =====`)

        const lines = vtg!!.lines.map(l => api.getLineById(l)).map(l => l?.name)
        console.log(`- Lines [${lines.length}]: ${lines.join(", ")}`)

        const stopPoints = vtg!!.stops.map(s => api.getStopPointById(s)).map(s => s?.name)
        console.log(`- Stops [${stopPoints.length}]: ${stopPoints.join(", ")}`)
    })
})
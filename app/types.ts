export type Departure = {
  departureId: string,
  departure: {
    aimed: string,
    expected: string,
  },
  transitState: string,
};

export type SkyssResponse = {
  data: {
    stopPlace_v3: {
      id: string,
      name: string,
      platforms: {
        __typename: string,
        id: string,
        publicCode: string,
        lineDepartures?: {
          departures: Departure[],
          line: {
            id: string,
            publicCode: string,
            name: string,
            frontText: string,
            direction: "outbound" | "inbound",
          }
        }[]
      }[]
    }
  }
};

export type BusLine = {
  id: string;
  name: string;
  stop: string;
  to: string;
  departures: Departure[];
};

export type YrResponse = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: number[]
  },
  properties: {
    meta: {
      updated_at: string,
      units: {
        air_pressure_at_sea_level: "hPa",
        air_temperature: "celsius",
        cloud_area_fraction: "%",
        precipitation_amount: "mm",
        relative_humidity: "%",
        wind_from_direction: "degrees",
        wind_speed: "m/s"
      }
    },
    timeseries: {
      time: string,
      data: {
        instant: {
          details: {
            air_pressure_at_sea_level: number,
            air_temperature: number,
            cloud_area_fraction: number,
            relative_humidity: number,
            wind_from_direction: number,
            wind_speed: number
          }
        },
        next_12_hours: {
          summary: {
            symbol_code: string
          },
          // details: {}
        },
        next_1_hours: {
          summary: {
            symbol_code: string
          },
          details: {
            precipitation_amount: number
          }
        },
        next_6_hours: {
          summary: {
            symbol_code: string
          },
          details: {
            precipitation_amount: number
          }
        }
      }
    }[],
  }
};

export type SkyssResponse = {
  resultCode: "SUCCESS" | string,
  StopGroups: {
    Identifier: string,
    Description: string,
    Location: string,
    ServiceModes: "Bus" | string[],
    ServiceModes2: "Bus" | string[],
    Stops: {
      Identifier: string,
      Description: string,
      Location: string,
      ServiceModes: string[],
      SkyssId: string,
      RouteDirections: {
        PublicIdentifier: string,
        Direction: "outbound" | "inbound",
        DirectionName: string,
        ServiceMode: "Bus" | string,
        ServiceMode2: "Bus" | string,
        Identifier: string,
        PassingTimes: {
          Timestamp: string,
          TripIdentifier: string,
          Status: "Early" | "Late" | "Schedule",
          DisplayTime: string,
          Notes: string[],
          PredictionInaccurate: string,
          Passed: boolean,
          Occupancy?: "LOW" | "MEDIUM" | "HIGH"
        }[],
        Notes: []
      }[],
      Municipality: string,
      StopGroupId: string
    }[],
    LineCodes: string[],
    Municipality: string
  }[]
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

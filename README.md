# SaqtauAI
SaqtauAI App

The frontend now follows the current measurement contract:

- `POST /api/v1/measurements/`
- camera payload is `multipart/form-data`
- `source_type=camera_rppg`
- `source_video=<video file>`
- the returned measurement ID is persisted locally
- `GET /api/v1/measurements/{id}/` is polled until `completed` or `failed`

The camera request intentionally does **not** include `sensor_payload`. The current Django serializer rejects IMU data when `source_type=camera_rppg`.

The accelerometer in Part 3 is therefore used locally only to show whether the phone is moving too much during the camera check-in. The backend BCG endpoint is a separate measurement type (`accelerometer_bcg`) with a different capture contract and a `chest_supine` placement requirement, so it should not be silently mixed into a face-camera measurement.

## Raw video cleanup still needed on Django

The mobile app deletes its local camera-cache copy after the server successfully accepts the upload.

The current backend code provided to ChatGPT clearly deletes `source_video` if dispatching the analysis task fails, and when account data is deleted. It does not clearly show successful post-analysis deletion of `source_video`.

That means the privacy behavior we agreed on for guest users is not fully guaranteed yet on the server.

Recommended backend rule:

1. Save the uploaded source only long enough to run analysis.
2. Run the rPPG pipeline.
3. Save the processed measurement fields.
4. In a server-side `finally`/cleanup path, delete the raw `source_video` file when retention is not required.
5. Keep the processed measurement object/results.

Do this on the backend/task/storage layer rather than trying to delete the whole measurement from the phone, because deleting the measurement would also remove the processed result we want to keep.

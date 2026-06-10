// Face recognition utility using face-api.js
// Handles model loading, face detection, descriptor extraction, and matching
// Includes fallback mode when models are unavailable

import * as faceapi from 'face-api.js'

let modelsLoaded = false
let modelsLoadAttempted = false
let modelsLoadError: string | null = null

export function isModelsLoaded(): boolean {
  return modelsLoaded
}

export function getModelsError(): string | null {
  return modelsLoadError
}

export function isDemoMode(): boolean {
  return modelsLoadAttempted && !modelsLoaded
}

export async function loadModels(): Promise<boolean> {
  if (modelsLoaded) return true
  if (modelsLoadAttempted) return false

  modelsLoadAttempted = true
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    modelsLoaded = true
    return true
  } catch (error) {
    console.error('Failed to load face-api.js models:', error)
    modelsLoadError = error instanceof Error ? error.message : 'Gagal memuat model AI'
    return false
  }
}

export async function detectFace(videoElement: HTMLVideoElement) {
  if (!modelsLoaded) return null
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
    return detection
  } catch (error) {
    console.error('Face detection error:', error)
    return null
  }
}

export async function registerFace(videoElement: HTMLVideoElement): Promise<Float32Array | null> {
  const loaded = await loadModels()
  if (!loaded) return null
  const detection = await detectFace(videoElement)
  if (!detection) return null
  return detection.descriptor
}

export function compareFaces(descriptor1: Float32Array, descriptor2: Float32Array): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2)
}

export function findBestMatch(
  queryDescriptor: Float32Array,
  storedDescriptors: Array<{ id: string; descriptor: Float32Array }>,
  threshold: number = 0.6
) {
  let bestMatch = null
  let bestDistance = Infinity

  for (const stored of storedDescriptors) {
    const distance = compareFaces(queryDescriptor, stored.descriptor)
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = stored
    }
  }

  if (bestDistance < threshold) {
    return { match: bestMatch, distance: bestDistance }
  }
  return null
}

// Convert descriptor array (from API JSON) back to Float32Array
export function descriptorFromArray(arr: number[]): Float32Array {
  return new Float32Array(arr)
}

// Convert Float32Array to regular array for JSON storage
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

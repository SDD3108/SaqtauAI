Pod::Spec.new do |s|
  s.name           = 'SaqtauScreenTime'
  s.version        = '1.0.0'
  s.summary        = 'SaqtauAI Apple Screen Time bridge'
  s.description    = 'Local Expo module for FamilyControls, DeviceActivity and ManagedSettings.'
  s.license        = { :type => 'MIT' }
  s.author         = { 'SaqtauAI' => 'dev@saqtau.ai' }
  s.homepage       = 'https://saqtau.ai'
  s.platforms      = { :ios => '18.0' }
  s.swift_version  = '5.0'
  s.source         = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'FamilyControls', 'ManagedSettings', 'DeviceActivity', 'SwiftUI', 'UIKit'
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end

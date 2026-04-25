require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "LLMSelectableText"
  s.version      = package["version"]
  s.summary      = "Native selectable text view for llm-markdown."
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }

  s.source_files = "native/ios/**/*.{h,m,mm,cpp}"
  s.private_header_files = "native/ios/**/*.h"

  install_modules_dependencies(s)
end

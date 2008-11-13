if !ActiveSupport.respond_to?(:use_standard_json_time_format)
  # assume we're in rails 2.0, which doesn't support this option.
  # lets add it so that the code below works the same in all rails versions.
  module ActiveSupport
    mattr_accessor :use_standard_json_time_format
  end
  ActiveSupport.use_standard_json_time_format = true
end

unless ActiveSupport.use_standard_json_time_format
  RAILS_DEFAULT_LOGGER.error("JSON Schema support in dojo expects standard JSON time format. Please edit new_rails_defaults.rb to have 'ActiveSupport.use_standard_json_time_format = true'")
end

if ActiveRecord::Base.respond_to?(:include_root_in_json) and ActiveRecord::Base.include_root_in_json
  raise "DojoXRailsStore doesn't support include_root_in_json. Please edit new_rails_defaults.rb"
end

class DateTime
  def to_json(options = nil)
    if ActiveSupport.use_standard_json_time_format
      xmlschema.inspect
    else
      strftime('"%Y/%m/%d %H:%M:%S %z"')
    end
  end
end

class Time
  def to_json(options = nil)
    if ActiveSupport.use_standard_json_time_format
      xmlschema.inspect
    else
      to_datetime.to_json
    end
  end
end

class Date
  def to_json(options = nil)
    if ActiveSupport.use_standard_json_time_format
      %("#{strftime("%Y-%m-%d")}")
    else
      %("#{strftime("%Y/%m/%d")}")
    end
  end
end

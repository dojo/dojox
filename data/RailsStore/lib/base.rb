module ActionController
  class Base
    class << self
      
      def dojox_rails_store(options={})
        before_filter :namespace_generic_json_params_to_controller

        cattr_accessor :rails_store_pagination_options
        self.rails_store_pagination_options = options

        include RailsStore::AbstractAccessors
        include RailsStore::RangeHeader
        include RailsStore::Sorting

        case ActionController.restful_subsystem
        when 'resource_controller'
          singleton = options.delete(:singleton)
          singleton ? resource_controller(:singleton) : resource_controller
          resource_controller_rails_store(options)
        when 'make_resourceful'
          make_resourceful do
            actions :all
            make_resourceful_rails_store(options)
          end
        when 'scaffold'
          scaffold_rails_store(options)
        end
      end

    end

    private

    def namespace_generic_json_params_to_controller
      if data = params.delete(:_json)
        name = controller_name
        name = name.to_s.singularize unless data.is_a?(Array)
        params.update(name=>data)
      end
    end
    
  end
end

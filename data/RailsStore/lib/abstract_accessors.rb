module ActionController
  mattr_accessor :restful_subsystem
end

if defined?(ResourceController::ActionControllerExtension)
  ActionController.restful_subsystem = 'resource_controller'
elsif defined?(Resourceful::Base)
  ActionController.restful_subsystem = 'make_resourceful'
else
  ActionController.restful_subsystem = 'scaffold'
end

module RailsStore
  module AbstractAccessors
    def self.included(controller)
      controller.class_eval do
        case ActionController.restful_subsystem
        when 'resource_controller'
          include ResourceController
        when 'make_resourceful'
          include MakeResourceful
        when 'scaffold'
          include Scaffold
        end
      end
    end
    
    module ResourceController
      def collection_object
        collection
      end
      def model_object
        end_of_association_chain
      end
    end
    
    module MakeResourceful
      def collection_object
        current_objects
      end
      def model_object
        current_model
      end
    end
    
    module Scaffold
      def collection_object
        instance_variable_name = controller_name.pluralize.camelize
        instance_variable_get("@#{instance_variable_name}")
      end
      def model_object
        model_name = controller_name.singularize.camelize
        model_name.constantize
      end
    end

  end
end

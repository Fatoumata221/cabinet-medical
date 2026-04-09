import React from 'react';
import { CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const RdvStepper = ({ steps, currentStep }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:space-x-4 space-y-4 md:space-y-0">
      {steps.map((step, index) => {
        const isCompleted = currentStep > index;
        const isCurrent = currentStep === index;
        return (
          <div key={step.id} className="flex items-start md:flex-1 gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                isCurrent
                  ? 'border-medical-primary text-medical-primary'
                  : isCompleted
                    ? 'border-medical-primary bg-medical-primary text-white'
                    : 'border-gray-300 text-gray-500'
              }`}
            >
              {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{step.title}</p>
              <p className="text-xs text-gray-500 leading-4">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

RdvStepper.propTypes = {
  steps: PropTypes.array.isRequired,
  currentStep: PropTypes.number.isRequired
};

export default RdvStepper;

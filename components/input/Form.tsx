import { Formik, FormikHelpers, FormikProps } from "formik";
import React from "react";

interface IProps<T> {
  initialValues: T;
  validationSchema?: any;
  enableReinitialize?: boolean;
  children: (props: FormikProps<any>) => void;
  onSubmit?: (values: T, formikHelpers?: FormikHelpers<any>) => void;
}

export const ApForm: React.FC<IProps<any>> = ({
  initialValues,
  validationSchema,
  children,
  onSubmit,
  enableReinitialize,
}) => {
  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={(values: any, formikHelpers: FormikHelpers<any>) => {
        onSubmit && (onSubmit(values, formikHelpers) as any);
      }}
      enableReinitialize={enableReinitialize}
      
    >
      {(props) => (
        <>
          {typeof children === "function" ? children(props) : (children as any)}
        </>
      )}
    </Formik>
  );
};

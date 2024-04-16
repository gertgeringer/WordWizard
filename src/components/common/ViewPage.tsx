import React from "react";
import {Flex} from "@mantine/core";

interface ViewPageProps {
    children: React.ReactNode;
}

const ViewPage: React.FC<ViewPageProps> = (props) => {
    return (
        <Flex direction={"column"} m={"md"} flex={1}>
            {props.children}
        </Flex>
    )
}

export default ViewPage
import { AppShell } from "@mantine/core";
import 'simplebar-react/dist/simplebar.min.css';
import StudentsView from "./views/StudentsView";
import {Route, Routes, useNavigate} from "react-router-dom";
import DecksView from "./views/DecksView";
import Navbar from "./components/common/navbar/Navbar";
import AssessmentsView from "./views/AssessmentsView";
import ReadEvaluationView from "./views/ReadEvaluationView";
import {useEffect} from "react";
import SettingsView from "./views/SettingsView.tsx";


function App() {

    const navigate = useNavigate();

    useEffect(() => {
        navigate("/students");
    }, []);

    return (
        <AppShell>
            <AppShell.Navbar p={0}>
                <AppShell.Section grow>
                    <Navbar/>
                </AppShell.Section>
            </AppShell.Navbar>
            <AppShell.Main style={{display: "flex", paddingLeft: "50px"}}>
                <Routes>
                    <Route path='students' element={<StudentsView/>}/>
                    <Route path='decks' element={<DecksView/>}/>
                    <Route path='assessments' element={<AssessmentsView/>}/>
                    <Route path='evaluation/:evaluationId/student/:studentId' element={<ReadEvaluationView/>}/>
                </Routes>
            </AppShell.Main>
        </AppShell>
    );
}

export default App;

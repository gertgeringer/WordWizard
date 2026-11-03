import {AppShell, Group, Title} from "@mantine/core";
import 'simplebar-react/dist/simplebar.min.css';
import StudentsView from "./views/StudentsView";
import {Navigate, Outlet, Route, Routes} from "react-router-dom";
import DecksView from "./views/DecksView";
import Navbar from "./components/common/navbar/Navbar";
import ReadingView from "./views/ReadingView";
import StudentProgressView from "./views/StudentProgressView";
import SettingsView from "./views/SettingsView";

const MainLayout = () => (
    <AppShell header={{height: 64}} padding="md">
        <AppShell.Header px="md">
            <Group h="100%" justify="space-between">
                <Title order={3}>🧙 WordWizard</Title>
                <Navbar/>
            </Group>
        </AppShell.Header>
        <AppShell.Main>
            <Outlet/>
        </AppShell.Main>
    </AppShell>
);

function App() {
    return (
        <Routes>
            <Route element={<MainLayout/>}>
                <Route path='students' element={<StudentsView/>}/>
                <Route path='students/:studentId' element={<StudentProgressView/>}/>
                <Route path='decks' element={<DecksView/>}/>
                <Route path='settings' element={<SettingsView/>}/>
            </Route>
            {/* The reading screen is full screen, so the student is not distracted. */}
            <Route path='read/:assessmentId/student/:studentId' element={<ReadingView/>}/>
            <Route path='*' element={<Navigate to="/students" replace/>}/>
        </Routes>
    );
}

export default App;

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { fetchAuthSession } from "aws-amplify/auth";
import {
    ClassicEditor,
    AutoLink,
    Autosave,
    Bold,
    Essentials,
    Italic,
    Link,
    Paragraph,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

const LICENSE_KEY = 'GPL';

export default function App( {lastSaved, setLastSaved} ) {
    const editorContainerRef = useRef(null);
    const [editorData, setEditorData] = useState('');
    const editorRef = useRef(null);
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const { caseId } = useParams();

    useEffect(() => {
        setIsLayoutReady(true);

        const fetchNotes = async (caseId) => {
            try {
                const authSession = await fetchAuthSession();
                const token = authSession.tokens.idToken;

                const response = await fetch(
                    `${import.meta.env.VITE_API_ENDPOINT}student/notes?case_id=${encodeURIComponent(caseId)}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: token,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setEditorData(data.student_notes || "");
                } else {
                    console.error("Failed to fetch notes.");
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
            }
        };

        fetchNotes(caseId);

        return () => setIsLayoutReady(false);
    }, []);

    useEffect(() => {
        const saveButton = document.getElementById("saveButton");

        if (saveButton) {
            const handleSaveClick = async () => {
                const authSession = await fetchAuthSession();
                const token = authSession.tokens.idToken;

                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_ENDPOINT}student/notes?case_id=${encodeURIComponent(caseId)}`,
                        {
                            method: "PUT",
                            headers: {
                                Authorization: token,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ notes: editorData }),
                        }
                    );

                    if (!response.ok) {
                        throw new Error(`Failed to save notes: ${response.status} ${response.statusText}`);
                    }
                    
                    // Update last saved timestamp
                    const now = new Date();
                    setLastSaved(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
                } catch (error) {
                    console.error("Error saving notes:", error);
                }
            };

            saveButton.addEventListener("click", handleSaveClick);
            return () => {
                saveButton.removeEventListener("click", handleSaveClick);
            };
        }
    }, [editorData, caseId]);

    const { editorConfig } = useMemo(() => {
        if (!isLayoutReady) {
            return {};
        }

        return {
            editorConfig: {
                toolbar: {
                    items: ['bold', 'italic', '|', 'link'],
                    shouldNotGroupWhenFull: false
                },
                plugins: [
                    AutoLink,
                    Autosave,
                    Bold,
                    Essentials,
                    Italic,
                    Link,
                    Paragraph,
                    Table,
                    TableCaption,
                    TableCellProperties,
                    TableColumnResize,
                    TableProperties,
                    TableToolbar
                ],
                initialData: '',
                licenseKey: LICENSE_KEY,
                link: {
                    addTargetToExternalLinks: true,
                    defaultProtocol: 'https://',
                    decorators: {
                        toggleDownloadable: {
                            mode: 'manual',
                            label: 'Downloadable',
                            attributes: {
                                download: 'file'
                            }
                        }
                    }
                },
                placeholder: 'Type or paste your content here!',
                table: {
                    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
                }
            }
        };
    }, [isLayoutReady]);

    return (
        <div className="main-container" style={{ position: 'relative', paddingBottom: '30px' }}>
            <div ref={editorRef}>
                {editorConfig && <CKEditor editor={ClassicEditor} config={editorConfig} data={editorData} onChange={(event, editor) => setEditorData(editor.getData())} />}
            </div>
        </div>
    );
}

import { demoChildren } from '../demo/demoParentScenarioA';

export interface ChildProfile {
    id: string;
    name: string;
    level: string;
}

const STORAGE_KEY = 'elora_parent_children_list';

class ParentChildrenService {
    private children: ChildProfile[] = [];

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                this.children = JSON.parse(saved);
            } catch {
                this.children = this.getDefaultChildren();
            }
        } else {
            this.children = this.getDefaultChildren();
            this.saveToStorage();
        }
    }

    private getDefaultChildren(): ChildProfile[] {
        return demoChildren.map(c => ({
            id: c.id,
            name: c.name,
            level: (c as any).grade || 'Sec 3'
        }));
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.children));
    }

    getChildren(): ChildProfile[] {
        return [...this.children];
    }

    addChild(name: string, level: string): ChildProfile {
        const newChild: ChildProfile = {
            id: `child_${Date.now()}`,
            name,
            level,
        };
        this.children.push(newChild);
        this.saveToStorage();
        window.dispatchEvent(new CustomEvent('elora-children-updated'));
        return newChild;
    }

    removeChild(id: string) {
        this.children = this.children.filter(c => c.id !== id);
        this.saveToStorage();
        window.dispatchEvent(new CustomEvent('elora-children-updated'));
    }
}

export const parentChildrenService = new ParentChildrenService();

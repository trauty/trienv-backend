export interface IScene {
    scene_id: number;
    name: string;
    description: string;
    icon_url: string;
    banner_url: string;
    scene_url: string;
    approved: boolean;
    created_at: Date;
    updated_at: Date;
};
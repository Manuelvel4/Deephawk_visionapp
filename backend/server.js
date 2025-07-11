import { createApp } from './app.js';
import { UserModel } from './models/mongodb/users.js';
import { ProjectModel } from './models/mongodb/projects.js';
import { ImageModel } from './models/mongodb/images.js';
import { LabelModel } from './models/mongodb/labels.js';
import { S3Model } from './models/services/s3.js';
import { YoloModel } from './models/mongodb/yolo.js';

createApp({ userModel: UserModel, projectModel: ProjectModel, imageModel: ImageModel, labelModel: LabelModel, S3Model: S3Model, YoloModel: YoloModel });
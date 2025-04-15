import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
  {
    videoFile: {
      type: String // cloudinary
    },
    thumbnail: {
      type: String // cloudinary
    },
    title: {
      type: String
    },
    description: {
      type: String
    },
    duration: {
      type: Number //cloudinary
    },
    views: {
      type: Number,
      defaul: 0
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)